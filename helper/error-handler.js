function errorHandler(err, req, res, next) {
    //jwt authentication error handler
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            msg: 'The user is not authorized'
        })
    }
    //Validation error handler
    if (err.name === 'ValidationError') {
        return res.status(401).json({
            msg: err
        })
    }

    return res.status(500).json(err);

}

module.exports = errorHandler;