const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
// @access  Private
const getOverview = async (req, res) => {
  try {
    const [events, users] = await Promise.all([
      Event.find(),
      User.find()
    ]);
    
    const totalEvents = events.length;
    const totalTryouts = events.filter(e => e.eventType === 'Competitive Tryout').length;
    
    let totalApplications = 0;
    let totalApprovedPlayers = 0;
    let activeParticipants = 0;
    let sportCounts = {};

    let totalRatings = 0;
    let ratingCount = 0;
    let players = [];

    events.forEach(event => {
      totalApplications += event.teamRequests ? event.teamRequests.length : 0;
      totalApprovedPlayers += event.approvedPlayers ? event.approvedPlayers.length : 0;
      activeParticipants += event.participants ? event.participants.length : 0;
      
      if (event.teamRequests) {
        event.teamRequests.forEach(req => {
          if (req.teamStatus === 'Approved' && req.rating > 0) {
            totalRatings += req.rating;
            ratingCount++;
            players.push({ user: req.user, rating: req.rating, sport: event.sport });
          }
        });
      }

      const sport = event.sport;
      if (sport) {
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
      }
    });

    const averageTeamRating = ratingCount > 0 ? (totalRatings / ratingCount).toFixed(1) : 0;
    const topRatedPlayers = players.sort((a, b) => b.rating - a.rating).slice(0, 5);

    let mostPopularSport = "None";
    let maxCount = 0;
    for (const [sport, count] of Object.entries(sportCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostPopularSport = sport;
      }
    }

    let userSportCounts = {};
    let multiSportParticipationCount = 0;

    users.forEach(user => {
      if (user.preferredSports && user.preferredSports.length > 0) {
        if (user.preferredSports.length > 1) {
          multiSportParticipationCount++;
        }
        user.preferredSports.forEach(sport => {
          userSportCounts[sport] = (userSportCounts[sport] || 0) + 1;
        });
      }
    });

    let mostSelectedSport = "None";
    let maxUserSportCount = 0;
    let topSportsInterests = [];

    for (const [sport, count] of Object.entries(userSportCounts)) {
      if (count > maxUserSportCount) {
        maxUserSportCount = count;
        mostSelectedSport = sport;
      }
      topSportsInterests.push({ sport, count });
    }
    
    topSportsInterests = topSportsInterests.sort((a, b) => b.count - a.count).slice(0, 3).map(i => i.sport);

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
      pieChartData,
      averageTeamRating,
      topRatedPlayers,
      mostSelectedSport,
      multiSportParticipationCount,
      topSportsInterests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOverview };
