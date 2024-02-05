function migrationFunction(migration, context) {
  const commonContent = migration.editContentType('commonContent');
  const commonContentNewsletterLabelTextCode = commonContent.editField(
    'newsletterLabelTextCode'
  );
  commonContentNewsletterLabelTextCode.validations([
    { in: ['hubs', 'mdnplus', 'snp'] },
  ]);
}
module.exports = migrationFunction;
