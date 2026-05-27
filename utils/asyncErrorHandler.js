const asyncErrorHandler = (func) => {
  return (req, res, next) => {
    func(req, res, next).catch((err) => {
      console.log('Failed to fetch', err);
      res.status(500).json({
        status: 'failed',
        error: err.message || 'Something went wrong',
      });
    });
  };
};

export default asyncErrorHandler;
