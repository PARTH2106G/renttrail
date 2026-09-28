const Tenant = require('../models/Tenant');

exports.createTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.create({
      ...req.body,
      landlordId: req.user.id,
      phone: req.body.mobile,
      aadhaarRef: req.body.maskedAadhaar,
    });
    res.status(201).json(tenant);
  } catch (err) {
    next(err);
  }
};

exports.getTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.find({ landlordId: req.user.id }).sort('-createdAt');
    res.json(tenants);
  } catch (err) {
    next(err);
  }
};

exports.getTenantById = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    if (tenant.landlordId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(tenant);
  } catch (err) {
    next(err);
  }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.mobile) updates.phone = updates.mobile;
    if (updates.maskedAadhaar) updates.aadhaarRef = updates.maskedAadhaar;

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    if (tenant.landlordId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    Object.assign(tenant, updates);
    await tenant.save();
    res.json(tenant);
  } catch (err) {
    next(err);
  }
};

exports.deleteTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    if (tenant.landlordId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await tenant.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
