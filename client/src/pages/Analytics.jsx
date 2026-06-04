import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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
      <div className="min-h-screen bg-dark-900 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const PIE_COLORS = ['#2563eb', '#64748b'];

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 font-sans pb-12 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-blue-900/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="mb-10 text-center animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            Sports Analytics <span className="text-blue-500">Dashboard</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
            Monitoring engagement, structured tryout workflows, and talent identification impact across the campus sports environment.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <MetricCard title="Total Events" value={data?.totalEvents} icon="🏆" />
          <MetricCard title="Competitive Tryouts" value={data?.totalTryouts} icon="⚔️" />
          <MetricCard title="Total Applications" value={data?.totalApplications} icon="📝" />
          <MetricCard title="Approved Players" value={data?.totalApprovedPlayers} icon="🟢" />
          <MetricCard title="Active Participants" value={data?.activeParticipants} icon="👥" />
          <MetricCard title="Most Popular Sport" value={data?.mostPopularSport} icon="🔥" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Charts */}
          <div className="bg-dark-800/40 p-6 md:p-8 rounded-2xl border border-dark-700/80 shadow-sm backdrop-blur-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-white tracking-wide">Sport Distribution</h3>
              <span className="text-xs bg-blue-500/10 text-blue-450 px-2.5 py-0.5 rounded font-semibold border border-blue-500/20">Live Sync</span>
            </div>
            <div className="h-72 w-full relative">
              {(!data?.barChartData || data.barChartData.length === 0 || data.barChartData.every(d => d.value === 0)) ? (
                <div className="absolute inset-0 flex flex-col justify-center items-center text-slate-500 text-sm bg-dark-900/30 rounded-xl border border-dashed border-dark-700">
                  <span className="text-3xl mb-2">🏏</span>
                  No events created yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.barChartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sportBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="url(#sportBarGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-dark-800/40 p-6 md:p-8 rounded-2xl border border-dark-700/80 shadow-sm backdrop-blur-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-white tracking-wide">Application Success Rate</h3>
              <span className="text-xs bg-slate-500/10 text-slate-400 px-2.5 py-0.5 rounded font-semibold border border-slate-500/20">Ratio</span>
            </div>
            <div className="h-72 w-full relative">
              {(!data?.pieChartData || data.pieChartData.length === 0 || data.pieChartData.every(d => d.value === 0)) ? (
                <div className="absolute inset-0 flex flex-col justify-center items-center text-slate-500 text-sm bg-dark-900/30 rounded-xl border border-dashed border-dark-700">
                  <span className="text-3xl mb-2">📝</span>
                  No applications recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.pieChartData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {data?.pieChartData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} className="focus:outline-none transition-transform duration-300 hover:scale-[1.02] origin-center" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Insights & Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Participation Insights */}
          <div className="bg-dark-800/40 p-6 rounded-2xl border border-dark-700/80 shadow-sm backdrop-blur-md lg:col-span-1">
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-blue-500">💡</span> Key Insights
            </h3>
            <div className="space-y-3">
              <InsightCard label="Avg Applications per Tryout" value={data?.avgApplications} />
              <InsightCard label="Average Team Rating" value={data?.averageTeamRating !== undefined && data?.averageTeamRating !== 0 ? `⭐ ${data.averageTeamRating}` : '-'} />
              <InsightCard label="Total Team Selections" value={data?.totalApprovedPlayers} />
              <InsightCard label="Overall Active Users" value={data?.activeParticipants} />
              <InsightCard label="Most Selected Sport" value={data?.mostSelectedSport} />
              <InsightCard label="Multi-Sport Athletes" value={data?.multiSportParticipationCount} />
              <InsightCard label="Top 3 Interests" value={data?.topSportsInterests?.join(', ') || 'None'} />
            </div>
          </div>

          {/* Academic Impact Table */}
          <div className="bg-dark-800/40 p-6 rounded-2xl border border-dark-700/80 shadow-sm backdrop-blur-md lg:col-span-2 overflow-x-auto">
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-blue-500">📈</span> System Impact Analysis
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-900/60 border-b border-dark-700">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider rounded-tl-xl">Parameter</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Traditional Method</th>
                  <th className="p-4 text-xs font-semibold text-blue-400 uppercase tracking-wider rounded-tr-xl">Platform System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/60">
                <TableRow param="Team Selection" traditional="Random / Offline Signup" modern="Performance-Based Rating Tryouts" />
                <TableRow param="Evaluation Tracking" traditional="Manual Records / No Tracking" modern="Structured Digital Scorecards" />
                <TableRow param="Player Observation" traditional="Word-of-Mouth Observation" modern="Digital Performance Metrics & Insights" />
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

// Helper Components
const MetricCard = ({ title, value, icon }) => (
  <div className="relative overflow-hidden bg-dark-800/30 p-5 rounded-xl border border-dark-700 hover:border-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 group shadow-sm">
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-2xl font-extrabold text-white tracking-tight">{value !== undefined ? value : '-'}</h3>
      </div>
      <span className="text-xl p-2.5 bg-dark-900/60 border border-dark-700/60 rounded-xl">{icon}</span>
    </div>
  </div>
);

const InsightCard = ({ label, value }) => (
  <div className="bg-dark-900/40 p-3 rounded-xl border border-dark-700/40 flex justify-between items-center group hover:border-blue-500/30 hover:bg-dark-900/70 transition-all duration-200">
    <span className="text-xs text-slate-400 font-medium group-hover:text-slate-200 transition-colors">{label}</span>
    <span className="text-xs font-semibold text-blue-400 bg-dark-800/70 px-2.5 py-1 rounded-lg border border-dark-700/60 shadow-inner transition-all duration-200">{value !== undefined ? value : '-'}</span>
  </div>
);

const TableRow = ({ param, traditional, modern }) => (
  <tr className="hover:bg-dark-700/20 transition-colors">
    <td className="p-4 text-xs md:text-sm font-semibold text-slate-200">{param}</td>
    <td className="p-4 text-xs md:text-sm text-slate-500">{traditional}</td>
    <td className="p-4 text-xs md:text-sm font-bold text-blue-400 bg-blue-500/5 border-l-2 border-blue-500/30 pl-6">{modern}</td>
  </tr>
);

export default Analytics;
