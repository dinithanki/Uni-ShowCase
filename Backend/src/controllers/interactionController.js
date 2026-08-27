const interactionService = require("../services/interactionService");
const { sendError } = require("../utils/errorResponse");

const toggleLike = async (req, res) => {
  try {
    const result = await interactionService.toggleLike(req.params.id, req.user);
    return res.status(200).json({
      message: `Project ${result.action} successfully`,
      ...result,
    });
  } catch (error) {
    return sendError(res, error, 400, "Unable to update project like");
  }
};

const getLikesForProject = async (req, res) => {
  try {
    const result = await interactionService.getLikesForProject(
      req.params.id,
      req.user,
    );
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, 400, "Unable to load project likes");
  }
};

const followStudent = async (req, res) => {
  try {
    const result = await interactionService.followStudent(
      req.params.studentId,
      req.user,
    );
    return res.status(200).json({
      message: `Successfully ${result.status} student`,
      ...result,
    });
  } catch (error) {
    const statusCode = error.message.includes("Forbidden") ? 403 : 400;
    return sendError(res, error, statusCode, "Unable to update follow status");
  }
};

const getFollowStatus = async (req, res) => {
  try {
    const result = await interactionService.getFollowStatus(
      req.params.studentId,
      req.user,
    );
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, 400, "Unable to load follow status");
  }
};

module.exports = {
  toggleLike,
  getLikesForProject,
  followStudent,
  getFollowStatus,
};
