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
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-neon-blue"></div>
        </div>
      </div>
    );
  }

  const PIE_COLORS = ['#39ff14', '#ff00ff'];

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans pb-12 relative overflow-hidden">
      {/* Background Decorative Blob Glows */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-neon-pink/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="mb-10 text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
            Sports Analytics <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-green to-neon-pink">Dashboard</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            Monitoring engagement, structured tryout workflows, and talent identification impact across the campus sports environment.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <MetricCard title="Total Events" value={data?.totalEvents} icon="🏆" glowColor="blue" border="border-neon-blue/20" glowShadow="shadow-[0_0_20px_rgba(0,243,255,0.1)]" />
          <MetricCard title="Competitive Tryouts" value={data?.totalTryouts} icon="⚔️" glowColor="pink" border="border-neon-pink/20" glowShadow="shadow-[0_0_20px_rgba(255,0,255,0.1)]" />
          <MetricCard title="Total Applications" value={data?.totalApplications} icon="📝" glowColor="pink" border="border-neon-pink/20" glowShadow="shadow-[0_0_20px_rgba(255,0,255,0.1)]" />
          <MetricCard title="Approved Players" value={data?.totalApprovedPlayers} icon="🟢" glowColor="green" border="border-neon-green/20" glowShadow="shadow-[0_0_20px_rgba(57,255,20,0.1)]" />
          <MetricCard title="Active Participants" value={data?.activeParticipants} icon="👥" glowColor="blue" border="border-neon-blue/20" glowShadow="shadow-[0_0_20px_rgba(0,243,255,0.1)]" />
          <MetricCard title="Most Popular Sport" value={data?.mostPopularSport} icon="🔥" glowColor="green" border="border-neon-green/20" glowShadow="shadow-[0_0_20px_rgba(57,255,20,0.1)]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Charts */}
          <div className="bg-dark-800/40 p-6 md:p-8 rounded-3xl border border-dark-700/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-md hover:border-dark-700 transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">Sport Distribution</h3>
              <span className="text-xs bg-neon-blue/10 text-neon-blue px-2.5 py-1 rounded-full font-semibold border border-neon-blue/20">Live Sync</span>
            </div>
            <div className="h-72 w-full relative">
              {(!data?.barChartData || data.barChartData.length === 0 || data.barChartData.every(d => d.value === 0)) ? (
                <div className="absolute inset-0 flex flex-col justify-center items-center text-gray-500 text-sm bg-dark-900/30 rounded-2xl border border-dashed border-dark-700">
                  <span className="text-3xl mb-2">🏏</span>
                  No events created yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.barChartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sportBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00f3ff" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#ff00ff" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="url(#sportBarGradient)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-dark-800/40 p-6 md:p-8 rounded-3xl border border-dark-700/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-md hover:border-dark-700 transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">Application Success Rate</h3>
              <span className="text-xs bg-neon-pink/10 text-neon-pink px-2.5 py-1 rounded-full font-semibold border border-neon-pink/20">Ratio</span>
            </div>
            <div className="h-72 w-full relative">
              {(!data?.pieChartData || data.pieChartData.length === 0 || data.pieChartData.every(d => d.value === 0)) ? (
                <div className="absolute inset-0 flex flex-col justify-center items-center text-gray-500 text-sm bg-dark-900/30 rounded-2xl border border-dashed border-dark-700">
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
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} className="focus:outline-none transition-transform duration-300 hover:scale-105 origin-center" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
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
          <div className="bg-dark-800/40 p-6 rounded-3xl border border-dark-700/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-md lg:col-span-1">
            <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-neon-blue">💡</span> Key Insights
            </h3>
            <div className="space-y-3.5">
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
          <div className="bg-dark-800/40 p-6 rounded-3xl border border-dark-700/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-md lg:col-span-2 overflow-x-auto">
            <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-neon-pink">📈</span> System Impact Analysis
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-900/60 border-b border-dark-700">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest rounded-tl-2xl">Parameter</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Traditional Method</th>
                  <th className="p-4 text-xs font-bold text-neon-blue uppercase tracking-widest rounded-tr-2xl">Platform System</th>
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
const MetricCard = ({ title, value, icon, glowColor, border, glowShadow }) => (
  <div className={`relative overflow-hidden bg-dark-800/30 backdrop-blur-md p-6 rounded-3xl border ${border} ${glowShadow} hover:border-neon-${glowColor}/60 hover:-translate-y-1.5 transition-all duration-300 group`}>
    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-neon-${glowColor}/10 rounded-full blur-2xl group-hover:bg-neon-${glowColor}/20 transition-all duration-300`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">{title}</p>
        <h3 className="text-3xl font-extrabold text-white tracking-tight group-hover:scale-[1.02] transition-transform duration-300">{value !== undefined ? value : '-'}</h3>
      </div>
      <span className="text-2xl p-3 bg-dark-900/60 border border-dark-700/60 rounded-2xl group-hover:rotate-6 group-hover:scale-110 transition-all duration-300">{icon}</span>
    </div>
  </div>
);

const InsightCard = ({ label, value }) => (
  <div className="bg-dark-900/40 p-4 rounded-2xl border border-dark-700/40 flex justify-between items-center group hover:border-neon-blue/30 hover:bg-dark-900/70 transition-all duration-300">
    <span className="text-xs text-gray-400 font-medium group-hover:text-gray-200 transition-colors">{label}</span>
    <span className="text-xs font-bold text-neon-blue bg-dark-800/70 px-3 py-1.5 rounded-xl border border-dark-700/60 shadow-inner group-hover:border-neon-blue/20 transition-all duration-300">{value !== undefined ? value : '-'}</span>
  </div>
);

const TableRow = ({ param, traditional, modern }) => (
  <tr className="hover:bg-dark-700/20 transition-colors">
    <td className="p-4 text-xs md:text-sm font-semibold text-gray-200">{param}</td>
    <td className="p-4 text-xs md:text-sm text-gray-500">{traditional}</td>
    <td className="p-4 text-xs md:text-sm font-bold text-neon-blue bg-neon-blue/5 border-l-2 border-neon-blue/40 pl-6">{modern}</td>
  </tr>
);

export default Analytics;
