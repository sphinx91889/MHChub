/*
  # GFE Customer Reporting View

  1. Changes
    - Create materialized view for GFE reporting by customer
    - Add indexes for efficient querying
    - Add refresh trigger for real-time updates
    
  2. Security
    - Grant access to authenticated users
*/

-- Create materialized view for GFE reporting
CREATE MATERIALIZED VIEW gfe_customer_report AS
SELECT
  customer_location_id,
  company_name,
  month,
  gfe_count,
  unique_patients,
  avg_completion_time,
  COALESCE(LAG(gfe_count) OVER w, 0) as previous_month_count,
  CASE 
    WHEN COALESCE(LAG(gfe_count) OVER w, 0) > 0 
    THEN (gfe_count - LAG(gfe_count) OVER w)::float / 
         LAG(gfe_count) OVER w * 100
    ELSE 0
  END as growth_percentage
FROM (
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
) subquery
WINDOW w AS (PARTITION BY customer_location_id ORDER BY month);

-- Create indexes for better performance
CREATE UNIQUE INDEX idx_gfe_customer_report_unique 
ON gfe_customer_report (customer_location_id, company_name, month);

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
CREATE TRIGGER refresh_gfe_customer_report_trigger
AFTER INSERT OR UPDATE OR DELETE ON gfe_records
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_gfe_customer_report();

-- Grant access to authenticated users
GRANT SELECT ON gfe_customer_report TO authenticated;