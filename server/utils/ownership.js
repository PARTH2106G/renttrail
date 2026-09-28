const Agreement = require('../models/Agreement');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const HttpError = require('./httpError');

const canAccessAgreement = async (agreementId, userId) => {
  const agreement = await Agreement.findById(agreementId).populate('propertyId');
  if (!agreement) throw new HttpError(404, 'Agreement not found');
  if (!agreement.propertyId) throw new HttpError(404, 'Linked property not found');

  const agreementOwner = agreement.landlordId?.toString();
  const propertyOwner = agreement.propertyId?.landlordId?.toString();
  if (agreementOwner !== userId && propertyOwner !== userId) {
    throw new HttpError(403, 'Forbidden');
  }
  return agreement;
};

const ensurePropertyOwnership = async (propertyId, userId) => {
  const property = await Property.findById(propertyId);
  if (!property) throw new HttpError(404, 'Property not found');
  if (property.landlordId.toString() !== userId) throw new HttpError(403, 'Forbidden');
  return property;
};

const ensureTenantOwnership = async (tenantId, userId) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new HttpError(404, 'Tenant not found');
  if (tenant.landlordId?.toString() !== userId) throw new HttpError(403, 'Forbidden');
  return tenant;
};

module.exports = {
  canAccessAgreement,
  ensurePropertyOwnership,
  ensureTenantOwnership,
};
