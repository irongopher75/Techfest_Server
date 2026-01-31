const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message;

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

module.exports = errorHandler;
