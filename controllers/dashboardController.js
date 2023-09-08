// Function to render the dashboard page
function renderDashboard(req, res) {
    res.render('app/dashboard', { user : req.decoded.user} );
}

// Export the function as a module
module.exports = {
    renderDashboard,
};
