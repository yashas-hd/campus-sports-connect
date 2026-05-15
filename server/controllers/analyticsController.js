const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
// @access  Private
const getOverview = async (req, res) => {
  try {
    const events = await Event.find();
    
    const totalEvents = events.length;
    const totalTryouts = events.filter(e => e.eventType === 'Competitive Tryout').length;
    
    let totalApplications = 0;
    let totalApprovedPlayers = 0;
    let activeParticipants = 0;
    let sportCounts = {};

    events.forEach(event => {
      totalApplications += event.teamRequests ? event.teamRequests.length : 0;
      totalApprovedPlayers += event.approvedPlayers ? event.approvedPlayers.length : 0;
      activeParticipants += event.participants ? event.participants.length : 0;
      
      const sport = event.sport;
      if (sport) {
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
      }
    });

    let mostPopularSport = "None";
    let maxCount = 0;
    for (const [sport, count] of Object.entries(sportCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostPopularSport = sport;
      }
    }

    const avgApplications = totalTryouts > 0 ? (totalApplications / totalTryouts).toFixed(1) : 0;

    const barChartData = Object.entries(sportCounts).map(([name, value]) => ({ name, value }));

    const pieChartData = [
      { name: 'Approved', value: totalApprovedPlayers },
      { name: 'Pending/Rejected', value: totalApplications > totalApprovedPlayers ? totalApplications - totalApprovedPlayers : 0 }
    ];

    res.json({
      totalEvents,
      totalTryouts,
      totalApplications,
      totalApprovedPlayers,
      activeParticipants,
      mostPopularSport,
      avgApplications,
      barChartData,
      pieChartData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOverview };
