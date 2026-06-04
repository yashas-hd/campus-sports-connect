import { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  FiAward, 
  FiActivity, 
  FiFileText, 
  FiCheckCircle, 
  FiUsers, 
  FiTrendingUp, 
  FiInfo, 
  FiTrendingDown 
} from 'react-icons/fi';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axiosInstance.get('/api/analytics/overview');
        setData(response.data);
      } catch (err) {
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-[60vh] flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-4">Loading Business Intelligence Feed...</p>
        </div>
      </SidebarLayout>
    );
  }

  const PIE_COLORS = ['#2563eb', '#4b5563'];

  // Map metrics to icons
  const metrics = [
    { title: 'Total Events', value: data?.totalEvents, icon: FiAward, desc: 'Fixtures organized' },
    { title: 'Competitive Tryouts', value: data?.totalTryouts, icon: FiActivity, desc: 'Selection gateways' },
    { title: 'Total Applications', value: data?.totalApplications, icon: FiFileText, desc: 'Athlete submissions' },
    { title: 'Approved Players', value: data?.totalApprovedPlayers, icon: FiCheckCircle, desc: 'Active selections' },
    { title: 'Active Participants', value: data?.activeParticipants, icon: FiUsers, desc: 'Unique athletes' },
    { title: 'Most Popular Sport', value: data?.mostPopularSport, icon: FiTrendingUp, desc: 'Highest engagement field' }
  ];

  return (
    <SidebarLayout>
      <div className="space-y-8 animate-fade-in-up">
        
        {/* Header section */}
        <div className="border-b border-zinc-800/80 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Sports Analytics <span className="text-blue-500">Dashboard</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl font-normal">
            Operational review, talent selection throughput, and digital transformation comparison across the campus network.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div 
                key={idx} 
                className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-all duration-200 flex items-center justify-between group shadow-sm"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{m.title}</p>
                  <h3 className="text-2xl font-extrabold text-white mb-0.5">{m.value !== undefined ? m.value : '-'}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">{m.desc}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-all duration-200">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Chart */}
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 mb-6">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Sport Distribution</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Active match operations by field</p>
              </div>
              <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 tracking-wider">LIVE SYNC</span>
            </div>
            
            <div className="h-72 w-full relative">
              {(!data?.barChartData || data.barChartData.length === 0 || data.barChartData.every(d => d.value === 0)) ? (
                <div className="absolute inset-0 flex flex-col justify-center items-center text-slate-500 text-xs bg-slate-950 border border-dashed border-slate-800 rounded-xl">
                  <FiInfo className="h-6 w-6 text-slate-600 mb-2" />
                  No events organized yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.barChartData || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sportBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.15} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} 
                    />
                    <Bar dataKey="value" fill="url(#sportBarGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Success Rate Chart */}
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 mb-6">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Application success rate</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Approved vs rejected tryouts</p>
              </div>
              <span className="text-[9px] font-bold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 tracking-wider">RATIO</span>
            </div>

            <div className="h-72 w-full relative">
              {(!data?.pieChartData || data.pieChartData.length === 0 || data.pieChartData.every(d => d.value === 0)) ? (
                <div className="absolute inset-0 flex flex-col justify-center items-center text-slate-500 text-xs bg-slate-955 border border-dashed border-slate-800 rounded-xl">
                  <FiInfo className="h-6 w-6 text-slate-600 mb-2" />
                  No applications recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.pieChartData || []}
                      cx="50%"
                      cy="48%"
                      innerRadius={60}
                      outerRadius={88}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {data?.pieChartData?.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PIE_COLORS[index % PIE_COLORS.length]} 
                          className="focus:outline-none transition-all duration-300 hover:scale-[1.01] origin-center" 
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Insights & Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Insights List */}
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between lg:col-span-1">
            <div className="border-b border-slate-800/80 pb-4 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>💡</span> Key platform Insights
              </h3>
            </div>
            <div className="flex-1 space-y-2">
              <InsightRow label="Avg Apps per Tryout" value={data?.avgApplications} />
              <InsightRow label="Avg Team Rating" value={data?.averageTeamRating ? `⭐ ${data.averageTeamRating}` : 'N/A'} />
              <InsightRow label="Total Team Selections" value={data?.totalApprovedPlayers} />
              <InsightRow label="Active Platform Users" value={data?.activeParticipants} />
              <InsightRow label="Most Selected Sport" value={data?.mostSelectedSport} />
              <InsightRow label="Multi-Sport Athletes" value={data?.multiSportParticipationCount} />
              <InsightRow label="Top Interests" value={data?.topSportsInterests?.join(', ') || 'N/A'} />
            </div>
          </div>

          {/* Academic Impact Comparison Table */}
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm lg:col-span-2 overflow-hidden flex flex-col justify-between">
            <div className="border-b border-slate-800/80 pb-4 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>📈</span> System Impact Analysis
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40">
                    <th className="p-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parameter</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Traditional Method</th>
                    <th className="p-3.5 text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/5">Platform System</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <ComparisonRow 
                    param="Team Selection" 
                    traditional="Random / Offline Signup" 
                    modern="Performance-Based Rating Tryouts" 
                  />
                  <ComparisonRow 
                    param="Evaluation Tracking" 
                    traditional="Manual Records / Paper" 
                    modern="Structured Digital Scorecards" 
                  />
                  <ComparisonRow 
                    param="Player Observation" 
                    traditional="Word-of-Mouth Observation" 
                    modern="Digital Performance Metrics & Insights" 
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </SidebarLayout>
  );
};

// Sub-components helpers
const InsightRow = ({ label, value }) => (
  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/60 flex justify-between items-center transition-all duration-200 group">
    <span className="text-[11px] text-slate-400 font-semibold group-hover:text-slate-200 transition-colors">{label}</span>
    <span className="text-[10px] font-bold text-blue-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 shadow-inner group-hover:border-slate-700 transition-all duration-200">
      {value !== undefined ? value : '-'}
    </span>
  </div>
);

const ComparisonRow = ({ param, traditional, modern }) => (
  <tr className="hover:bg-slate-900/30 transition-colors group">
    <td className="p-3.5 text-xs font-bold text-zinc-200">{param}</td>
    <td className="p-3.5 text-xs text-slate-400 font-medium">{traditional}</td>
    <td className="p-3.5 text-xs font-extrabold text-blue-500 bg-blue-500/5 border-l-2 border-blue-600/30 pl-5">
      {modern}
    </td>
  </tr>
);

export default Analytics;
