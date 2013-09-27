// check if user is logged in
exports.home = function(req, res) {
    if(req.user)
        res.redirect("/dashboard");
    else
        res.render('index', { title: 'Switch Reports' });
};
