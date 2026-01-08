// Helper middleware to apply multiple rate limiters sequentially
export const applyRateLimits = (...limiters) => {
  return (req, res, next) => {
    const applyNextLimiter = (index) => {
      if (index >= limiters.length) {
        return next();
      }

      const limiter = limiters[index];
      limiter(req, res, (err) => {
        if (err) {
          return next(err);
        }
        applyNextLimiter(index + 1);
      });
    };

    applyNextLimiter(0);
  };
};

export default applyRateLimits;