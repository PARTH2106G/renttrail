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
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.landlordId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    Object.assign(property, req.body);
    await property.save();
    res.json(property);
  } catch (err) {
    next(err);
  }
};
