function migrationFunction(migration, context) {
  const capability = migration.editContentType('capability');
  const capabilitySlug = capability.editField('slug');
  capabilitySlug.validations([]);
}
module.exports = migrationFunction;
