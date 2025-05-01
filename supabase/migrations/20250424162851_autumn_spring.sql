/*
  # Improve GFE Customer Report System

  1. Changes
    - Add indexes for better performance
    - Add function to refresh materialized view
    - Update view to handle historical data properly
    
  2. Security
    - Maintain existing security policies
*/

-- Drop existing view and recreate with improvements
DROP MATERIALIZED VIEW IF EXISTS gfe_customer_report;

CREATE MATERIALIZED VIEW gfe_customer_report AS
WITH monthly_data AS (
  SELECT
    customer_location_id,
    company_name,
    DATE_TRUNC('month', completed_at) as month,
    COUNT(*) as gfe_count,
    COUNT(DISTINCT patient_id) as unique_patients,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_completion_time
  FROM gfe_records
  WHERE completed_at IS NOT NULL
  GROUP BY customer_location_id, company_name, DATE_TRUNC('month', completed_at)
),
previous_month_data AS (
  SELECT
    customer_location_id,
    month,
    gfe_count,
    LAG(gfe_count) OVER (
      PARTITION BY customer_location_id 
      ORDER BY month
    ) as prev_month_count
  FROM monthly_data
)
SELECT
  md.customer_location_id,
  md.company_name,
  md.month,
  md.gfe_count,
  md.unique_patients,
  md.avg_completion_time,
  pmd.prev_month_count as previous_month_count,
  CASE 
    WHEN pmd.prev_month_count > 0 
    THEN ((md.gfe_count - pmd.prev_month_count)::float / pmd.prev_month_count * 100)
    ELSE 0
  END as growth_percentage
FROM monthly_data md
JOIN previous_month_data pmd ON 
  md.customer_location_id = pmd.customer_location_id AND
  md.month = pmd.month
ORDER BY md.month DESC, md.company_name;

-- Create indexes for better performance
CREATE UNIQUE INDEX idx_gfe_customer_report_unique 
ON gfe_customer_report (customer_location_id, month);

CREATE INDEX idx_gfe_customer_report_month 
ON gfe_customer_report (month);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_gfe_customer_report()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY gfe_customer_report;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh the view
DROP TRIGGER IF EXISTS refresh_gfe_customer_report_trigger ON gfe_records;
CREATE TRIGGER refresh_gfe_customer_report_trigger
AFTER INSERT OR UPDATE OR DELETE ON gfe_records
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_gfe_customer_report();