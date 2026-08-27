const projectService = require("../services/projectService");
const { sendError } = require("../utils/errorResponse");

const createProject = async (req, res) => {
  try {
    const project = await projectService.createProject(
      req.user.id || req.user._id,
      req.body,
      req.files,
      req.user,
    );
    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    return sendError(res, error, 400, "Unable to create project");
  }
};

const getProjects = async (req, res) => {
  try {
    const { projects, total, page, limit, pages } =
      await projectService.getProjects(req.user, req.query);
    return res.status(200).json({
      count: projects.length,
      total,
      page,
      limit,
      pages,
      projects,
    });
  } catch (error) {
    return sendError(res, error, 500, "Unable to load projects");
  }
};

const getLikedProjects = async (req, res) => {
  try {
    const { projects, total, page, limit, pages } =
      await projectService.getLikedProjects(req.user, req.query);
    return res.status(200).json({
      count: projects.length,
      total,
      page,
      limit,
      pages,
      projects,
    });
  } catch (error) {
    return sendError(res, error, 500, "Unable to load liked projects");
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user,
    );
    return res.status(200).json({ project });
  } catch (error) {
    const statusCode = error.message.includes("Access denied") ? 403 : 404;
    return sendError(res, error, statusCode, "Unable to load project");
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.body,
      req.files,
      req.user,
    );
    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    const statusCode = error.message.includes("Forbidden") ? 403 : 400;
    return sendError(res, error, statusCode, "Unable to update project");
  }
};

const deleteProject = async (req, res) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user);
    return res.status(200).json({
      message: "Project deleted successfully",
      ...result,
    });
  } catch (error) {
    const statusCode = error.message.includes("Forbidden") ? 403 : 400;
    return sendError(res, error, statusCode, "Unable to delete project");
  }
};

const updateVisibility = async (req, res) => {
  try {
    const { isPublic } = req.body;
    const project = await projectService.updateVisibility(
      req.params.id,
      isPublic,
      req.user,
    );
    return res.status(200).json({
      message: `Project visibility updated to public: ${project.isPublic}`,
      project,
    });
  } catch (error) {
    const statusCode = error.message.includes("Forbidden") ? 403 : 400;
    return sendError(
      res,
      error,
      statusCode,
      "Unable to update project visibility",
    );
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateVisibility,
  getLikedProjects,
};
