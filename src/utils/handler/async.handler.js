// Promises
const asyncHandler = (requestHandler) => {
 return (error, req, res, next) => {
    Promise.resolve(requestHandler(error, req, res, next)).catch((error) =>
      next()
    );
  };
};

// Try catch
// const asyncHandler = (requestHandler) => async (error, req, res, next) => {
//     try {
//         await requestHandler(error, req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

export { asyncHandler };
