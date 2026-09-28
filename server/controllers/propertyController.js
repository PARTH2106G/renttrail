const Property = require('../models/Property');

exports.createProperty = async (req, res, next) => {
  try {
    const property = await Property.create({ ...req.body, landlordId: req.user.id });
    res.status(201).json(property);
  } catch (err) {
    next(err);
  }
};

exports.getProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ landlordId: req.user.id });
    res.json(properties);
  } catch (err) {
    next(err);
  }
};

exports.updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(property);
  } catch (err) {
    next(err);
  }
};
