const Tenant = require('../models/Tenant');

exports.createTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.create(req.body);
    res.status(201).json(tenant);
  } catch (err) { next(err); }
};

exports.getTenants = async (req, res, next) => {
  try { res.json(await Tenant.find().sort('name')); }
  catch (err) { next(err); }
};

exports.getTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) { next(err); }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) { next(err); }
};
