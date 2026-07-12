const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');

/** Fetch the singleton Setting row, creating it with defaults if missing. */
async function getOrCreateSettings() {
  let setting = await prisma.setting.findFirst();
  if (!setting) setting = await prisma.setting.create({ data: {} });
  return setting;
}

/** GET /api/settings */
const getSettings = async (req, res, next) => {
  try {
    const setting = await getOrCreateSettings();
    res.json(new ApiResponse(200, { setting }, 'Settings retrieved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/settings — admin only */
const updateSettings = async (req, res, next) => {
  try {
    const current = await getOrCreateSettings();
    const {
      autoEmissionCalc,
      evidenceRequiredForCSR,
      autoAwardBadges,
      emailAlertsComplianceIssues,
      notifyComplianceIssue,
      notifyApprovals,
      notifyPolicyReminders,
      notifyBadgeUnlocks,
      weightEnv,
      weightSocial,
      weightGov,
    } = req.body;

    const setting = await prisma.setting.update({
      where: { id: current.id },
      data: {
        ...(autoEmissionCalc !== undefined && { autoEmissionCalc }),
        ...(evidenceRequiredForCSR !== undefined && { evidenceRequiredForCSR }),
        ...(autoAwardBadges !== undefined && { autoAwardBadges }),
        ...(emailAlertsComplianceIssues !== undefined && { emailAlertsComplianceIssues }),
        ...(notifyComplianceIssue !== undefined && { notifyComplianceIssue }),
        ...(notifyApprovals !== undefined && { notifyApprovals }),
        ...(notifyPolicyReminders !== undefined && { notifyPolicyReminders }),
        ...(notifyBadgeUnlocks !== undefined && { notifyBadgeUnlocks }),
        ...(weightEnv !== undefined && { weightEnv: Number(weightEnv) }),
        ...(weightSocial !== undefined && { weightSocial: Number(weightSocial) }),
        ...(weightGov !== undefined && { weightGov: Number(weightGov) }),
      },
    });
    res.json(new ApiResponse(200, { setting }, 'Settings updated'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings, getOrCreateSettings };
