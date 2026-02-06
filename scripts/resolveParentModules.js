// Helper to resolve modules from parent node_modules
const path = require('path');
const Module = require('module');

// Add parent node_modules to module resolution path
const parentNodeModules = path.join(__dirname, '../node_modules');

// Add parent node_modules to the beginning of module.paths
if (Module._nodeModulePaths) {
  const originalNodeModulePaths = Module._nodeModulePaths;
  Module._nodeModulePaths = function(from) {
    const paths = originalNodeModulePaths.call(this, from);
    // Insert parent node_modules at the beginning
    if (paths.indexOf(parentNodeModules) === -1) {
      paths.unshift(parentNodeModules);
    }
    return paths;
  };
} else {
  // Fallback: modify module.paths directly
  if (module.paths.indexOf(parentNodeModules) === -1) {
    module.paths.unshift(parentNodeModules);
  }
}
