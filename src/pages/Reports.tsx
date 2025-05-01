import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchApi } from '@/lib/api-config';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Label } from 'recharts';
import { format, parseISO } from 'date-fns';

interface MonthData {
  month: number;
  monthName: string;
  avgWaitTimeSeconds: number;
  gfeCount: number;
}

interface YearData {
  year: number;
  months: MonthData[];
}

interface GFEDashboardData {
  message: string;
  status: number;
  payload: YearData[];
}

interface CustomerGFEReport {
  customer_location_id: number;
  company_name: string;
  month: string;
  gfe_count: number;
  unique_patients: number;
  avg_completion_time: number;
  previous_month_count: number;
  growth_percentage: number;
}

export default function Reports() {
  const [data, setData] = useState<YearData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerReports, setCustomerReports] = useState<CustomerGFEReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), 'yyyy-MM')
  );
  const [waitTimeStats, setWaitTimeStats] = useState<Record<string, number>>({});
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch GFE dashboard data
        const [dashboardResponse, customerReportResponse] = await Promise.all([
          fetchApi('/gfe/dashboard?status=completed&status=reviewed&'),
          supabase
            .from('gfe_customer_report')
            .select('*')
            .order('month', { ascending: false })
        ]);
        
        setData(dashboardResponse.payload);
        
        if (customerReportResponse.error) throw customerReportResponse.error;
        setCustomerReports(customerReportResponse.data || []);
        
        // Fetch wait time stats from Supabase
        const { data: waitTimeData } = await supabase
          .from('gfe_timings')
          .select('wait_time_seconds, queued_at')
          .not('wait_time_seconds', 'is', null);

        if (waitTimeData) {
          const monthlyStats: {[key: string]: number[]} = {};
          
          waitTimeData.forEach(record => {
            const month = new Date(record.queued_at).toISOString().slice(0, 7);
            if (!monthlyStats[month]) {
              monthlyStats[month] = [];
            }
            monthlyStats[month].push(record.wait_time_seconds || 0);
          });

          const avgStats: {[key: string]: number} = {};
          Object.entries(monthlyStats).forEach(([month, times]) => {
            avgStats[month] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
          });

          setWaitTimeStats(avgStats);
        }
        
        // Get unique months from customer reports
        const months = Array.from(
          new Set(
            customerReportResponse.data?.map(r => 
              format(parseISO(r.month), 'yyyy-MM')
            ) || []
          )
        ).sort().reverse();
        
        setAvailableMonths(months);
        
        // Set initial selected month to most recent if none selected
        if (months.length > 0 && !selectedMonth) {
          setSelectedMonth(months[0]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching GFE dashboard data:', err);
        setError('Failed to load GFE dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  const getTotalGFECount = (yearData: YearData) => {
    return yearData.months.reduce((sum, month) => sum + month.gfeCount, 0);
  };

  const getAverageMonthlyGFE = (yearData: YearData) => {
    const total = getTotalGFECount(yearData);
    const monthsWithData = yearData.months.filter(m => m.gfeCount > 0).length;
    return monthsWithData ? Math.round(total / monthsWithData) : 0;
  };

  const getHighestMonth = (yearData: YearData) => {
    return yearData.months.reduce((max, month) => 
      month.gfeCount > max.gfeCount ? month : max
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-12 pt-5 md:pt-10">
        <h2 className="text-2xl font-bold">GFE Dashboard Reports</h2>
      </div>
      
      {/* Customer GFE Report */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>GFE Usage by Customer</CardTitle>
          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border rounded-md"
              disabled={isLoading}
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {format(parseISO(month), 'MMMM yyyy')}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={customerReports.filter(r => r.month.startsWith(selectedMonth))}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="company_name"
                  height={40}
                  tick={false}
                >
                  <Label value="Hover over bars to see company details" offset={0} position="bottom" />
                </XAxis>
                <YAxis />
                <Tooltip
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Growth') return `${value.toFixed(1)}%`;
                    if (name === 'Avg Time') return formatDuration(value);
                    return value;
                  }}
                  labelFormatter={(label) => `Company: ${label}`}
                />
                <Legend />
                <Bar
                  dataKey="gfe_count"
                  name="GFEs"
                  fill="#2563eb"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="unique_patients"
                  name="Unique Patients"
                  fill="#16a34a"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="growth_percentage"
                  name="Growth"
                  fill="#eab308"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">GFEs</th>
                  <th className="px-4 py-2 text-left">Unique Patients</th>
                  <th className="px-4 py-2 text-left">Avg Completion Time</th>
                  <th className="px-4 py-2 text-left">Growth</th>
                </tr>
              </thead>
              <tbody>
                {customerReports
                  .filter(r => r.month.startsWith(selectedMonth))
                  .map((report) => (
                    <tr key={`${report.customer_location_id}-${report.month}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{report.company_name}</td>
                      <td className="px-4 py-2">{report.gfe_count}</td>
                      <td className="px-4 py-2">{report.unique_patients}</td>
                      <td className="px-4 py-2">{formatDuration(report.avg_completion_time)}</td>
                      <td className="px-4 py-2">
                        <span className={
                          report.growth_percentage > 0 ? 'text-green-600' :
                          report.growth_percentage < 0 ? 'text-red-600' :
                          'text-gray-600'
                        }>
                          {report.growth_percentage > 0 ? '+' : ''}
                          {report.growth_percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data.map((yearData) => (
        <div key={yearData.year} className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="glass hover:shadow-glass-hover transition-all duration-300">
              <CardHeader className="border-l-4 border-l-blue-500">
                <CardTitle className="text-lg">Total GFEs</CardTitle>
                <div className="text-3xl font-bold text-blue-600">
                  {getTotalGFECount(yearData).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Year {yearData.year}</div>
              </CardHeader>
            </Card>

            <Card className="glass hover:shadow-glass-hover transition-all duration-300">
              <CardHeader className="border-l-4 border-l-green-500">
                <CardTitle className="text-lg">Monthly Average</CardTitle>
                <div className="text-3xl font-bold text-green-600">
                  {getAverageMonthlyGFE(yearData).toLocaleString()}
                  {waitTimeStats[`${yearData.year}-${String(yearData.months[0].month).padStart(2, '0')}`] && (
                    <div className="text-sm text-gray-600 mt-1">
                      Avg Wait: {formatDuration(waitTimeStats[`${yearData.year}-${String(yearData.months[0].month).padStart(2, '0')}`])}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">GFEs per month</div>
              </CardHeader>
            </Card>

            <Card className="glass hover:shadow-glass-hover transition-all duration-300">
              <CardHeader className="border-l-4 border-l-purple-500">
                <CardTitle className="text-lg">Peak Month</CardTitle>
                <div className="text-3xl font-bold text-purple-600">
                  {getHighestMonth(yearData).gfeCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {getHighestMonth(yearData).monthName}
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card className="glass hover:shadow-glass-hover transition-all duration-300">
            <CardHeader>
              <CardTitle>Monthly GFE Trends - {yearData.year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={yearData.months}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="monthName" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="gfeCount"
                      name="GFE Count"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-8">
                {yearData.months.map((month) => (
                  <div
                    key={month.month}
                    className={`p-4 rounded-lg ${
                      month.gfeCount > 0 ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium">{month.monthName}</div>
                    <div className={`text-xl font-bold ${
                      month.gfeCount > 0 ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {month.gfeCount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </>
  );
}