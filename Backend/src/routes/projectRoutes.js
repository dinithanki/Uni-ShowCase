const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const interactionController = require("../controllers/interactionController");
const { protect } = require("../middlewares/authMiddleware");
const { restrictTo } = require("../middlewares/roleMiddleware");
const { uploadProjectImages } = require("../middlewares/uploadMiddleware");

router.use(protect);

router.post(
  "/",
  restrictTo("Student"),
  uploadProjectImages,
  projectController.createProject,
);
router.get("/liked", projectController.getLikedProjects);
router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProjectById);
router.put(
  "/:id",
  restrictTo("Student", "Admin"),
  uploadProjectImages,
  projectController.updateProject,
);
router.delete(
  "/:id",
  restrictTo("Student", "Admin"),
  projectController.deleteProject,
);
router.patch(
  "/:id/visibility",
  restrictTo("Admin"),
  projectController.updateVisibility,
);
router.post("/:id/likes", interactionController.toggleLike);
router.get("/:id/likes", interactionController.getLikesForProject);

module.exports = router;
