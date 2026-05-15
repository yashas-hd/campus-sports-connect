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
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans pb-12">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
            Sports Analytics <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink">Dashboard</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Monitoring engagement, structured tryout workflows, and talent identification impact across the platform.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <MetricCard title="Total Events" value={data?.totalEvents} icon="🏆" color="from-blue-500/20 to-blue-600/10" border="border-blue-500/30" />
          <MetricCard title="Competitive Tryouts" value={data?.totalTryouts} icon="⚔️" color="from-neon-pink/20 to-pink-600/10" border="border-neon-pink/30" />
          <MetricCard title="Total Applications" value={data?.totalApplications} icon="📝" color="from-orange-500/20 to-orange-600/10" border="border-orange-500/30" />
          <MetricCard title="Approved Players" value={data?.totalApprovedPlayers} icon="🟢" color="from-neon-green/20 to-green-600/10" border="border-neon-green/30" />
          <MetricCard title="Active Participants" value={data?.activeParticipants} icon="👥" color="from-purple-500/20 to-purple-600/10" border="border-purple-500/30" />
          <MetricCard title="Most Popular Sport" value={data?.mostPopularSport} icon="🔥" color="from-red-500/20 to-red-600/10" border="border-red-500/30" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Charts */}
          <div className="bg-dark-800/80 p-6 rounded-3xl border border-dark-700 shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6">Sport Distribution</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#334155' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="value" fill="#00f3ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-dark-800/80 p-6 rounded-3xl border border-dark-700 shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6">Application Success Rate</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data?.pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Insights & Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Participation Insights */}
          <div className="bg-dark-800/80 p-6 rounded-3xl border border-dark-700 shadow-xl backdrop-blur-sm lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-neon-blue">💡</span> Key Insights
            </h3>
            <div className="space-y-4">
              <InsightCard label="Avg Applications per Tryout" value={data?.avgApplications} />
              <InsightCard label="Average Team Rating" value={data?.averageTeamRating ? `⭐ ${data.averageTeamRating}` : '-'} />
              <InsightCard label="Total Team Selections" value={data?.totalApprovedPlayers} />
              <InsightCard label="Overall Active Users" value={data?.activeParticipants} />
            </div>
          </div>

          {/* Academic Impact Table */}
          <div className="bg-dark-800/80 p-6 rounded-3xl border border-dark-700 shadow-xl backdrop-blur-sm lg:col-span-2 overflow-x-auto">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-neon-pink">📈</span> System Impact Analysis
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-600">
                  <th className="p-4 text-sm font-bold text-gray-400 uppercase tracking-wider rounded-tl-xl">Parameter</th>
                  <th className="p-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Traditional Method</th>
                  <th className="p-4 text-sm font-bold text-neon-blue uppercase tracking-wider rounded-tr-xl">Platform-Based System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                <TableRow param="Team Selection" traditional="Random Selection" modern="Performance-Based Selection" />
                <TableRow param="Evaluation Tracking" traditional="No Evaluation Tracking" modern="Structured Player Ratings" />
                <TableRow param="Player Observation" traditional="Manual Observation" modern="Digital Performance Insights" />
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

// Helper Components
const MetricCard = ({ title, value, icon, color, border }) => (
  <div className={`bg-gradient-to-br ${color} p-6 rounded-3xl border ${border} shadow-lg hover:-translate-y-1 hover:shadow-2xl transition-all duration-300`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
        <h3 className="text-3xl font-extrabold text-white">{value !== undefined ? value : '-'}</h3>
      </div>
      <span className="text-3xl opacity-80">{icon}</span>
    </div>
  </div>
);

const InsightCard = ({ label, value }) => (
  <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-600 flex justify-between items-center group hover:border-dark-400 transition-colors">
    <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{label}</span>
    <span className="text-lg font-bold text-neon-blue bg-dark-800 px-3 py-1 rounded-lg shadow-inner">{value !== undefined ? value : '-'}</span>
  </div>
);

const TableRow = ({ param, traditional, modern }) => (
  <tr className="hover:bg-dark-700/30 transition-colors">
    <td className="p-4 text-sm font-medium text-gray-300">{param}</td>
    <td className="p-4 text-sm text-gray-500">{traditional}</td>
    <td className="p-4 text-sm font-bold text-white bg-neon-blue/5 border-l border-dark-700">{modern}</td>
  </tr>
);

export default Analytics;
