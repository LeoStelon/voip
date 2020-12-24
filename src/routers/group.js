const router = require("express").Router();
const auth = require("../middlewares/auth");
const Group = require("../models/group");

// Create Group
router.post("/group", auth, async (req, res) => {
	// const group=new Group({author:req.user._id})
	try {
		const group = await new Group({
			author: req.user._id,
			title: req.body.title,
		}).save();
		req.user.channels.push({ private: group._id, group: group._id });
		await req.user.save();
		res.status(201).send(group);
	} catch (e) {
		res.status(500).send({ message: e.message });
	}
});

// Read Group
router.get("/group", auth, async (req, res) => {
	const limit = req.query.limit;
	const search = req.query.search;
	try {
		const group = await Group.find({ title: { $regex: search } })
			.populate("author", "-channels")
			.populate("participants", "-channels")
			.limit(parseInt(limit))
			.exec();
		if (group) {
			return res.send(group);
		}
		res.status(404).send({ message: "Not found" });
	} catch (e) {
		res.status(500).send({ message: e.message });
	}
});

// Update Group
router.patch("/group/:id", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const availableUpdates = ["title", "participants"];
	const isValid = updates.every((update) => availableUpdates.includes(update));

	if (!isValid) {
		return res.status(400).send();
	}
	try {
		const group = await Group.findById(req.params.id);
		if (!group) {
			return res.status(404).send({ message: "Invalid group id" });
		}
		updates.forEach((update) => {
			if (update === "participants") {
				return req.body.participants.forEach((p) => {
					if (group.participants.indexOf(p) === -1) group.participants.push(p);
				});
			}
			group[update] = req.body[update];
		});

		await group.save();
		return res.send(group);
	} catch (e) {
		res.status(500).send({ message: e.message });
	}
});

// Delete Group
router.delete("/group/:id", auth, async (req, res) => {
	try {
		const group = await Group.findById(req.params.id);
		if (!group) {
			return res.status(404).send({ message: "Deleted" });
		}

		if (group.author._id === req.user._id) {
			await group.remove();
			return res.send({ message: "Deleted" });
		}
		res.status(401).send({ message: "Your not the admin" });
	} catch (e) {
		res.status(500).send({ message: e.message });
	}
});

module.exports = router;
