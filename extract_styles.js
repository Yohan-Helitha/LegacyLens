const fs = require('fs');
const path = require('path');

const files = [
  'src/screens/home/HomeScreen.tsx',
  'src/screens/admin/home/AdminHomeScreen.tsx',
  'src/screens/admin/moderation/ModerationQueueScreen.tsx',
  'src/screens/admin/opportunity-create/CreateOpportunityScreen.tsx',
  'src/screens/admin/opportunity-intake/OpportunityIntakeScreen.tsx',
  'src/screens/admin/opportunity-intake/OpportunityReviewScreen.tsx',
  'src/screens/content-details/blog-detail/BlogDetailScreen.tsx',
  'src/screens/content-details/video-detail/VideoDetailScreen.tsx',
  'src/screens/cultural-map/CulturalMapScreen.tsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, 'mobile-app', file);
  if (!fs.existsSync(fullPath)) {
    console.log('File not found:', fullPath);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  const styleMatch = content.match(/const styles = StyleSheet\.create\({[\s\S]*\}\);/);
  if (!styleMatch) {
    console.log('No styles found in:', file);
    return;
  }
  
  const stylesBlock = styleMatch[0];
  
  const themeMatch = content.match(/import\s+\{[^}]*\}\s+from\s+['"](?:\.\.\/)+theme['"];?/);
  
  const depth = file.split('/').length - 2; 
  const themePath = '../'.repeat(depth) + 'theme';
  
  let actualThemeImport = '';
  if (themeMatch) {
    actualThemeImport = themeMatch[0].replace(/(['"])(?:\.\.\/)+theme(['"])/, `$1${themePath}$2`);
  } else {
    actualThemeImport = `import { Colors, Typography, Spacing, Radii } from '${themePath}';`;
  }
  
  const stylesFileContent = `import { StyleSheet } from 'react-native';\n${actualThemeImport}\n\nexport ${stylesBlock}\n`;
  
  const parsedPath = path.parse(fullPath);
  const stylesPath = path.join(parsedPath.dir, parsedPath.name + '.styles.ts');
  fs.writeFileSync(stylesPath, stylesFileContent);
  
  content = content.replace(stylesBlock, '');
  
  content = content.replace(/StyleSheet,?\s*/, '');
  
  const importToAdd = `import { styles } from './${parsedPath.name}.styles';`;
  
  const lastImportIndex = content.lastIndexOf('import ');
  if (lastImportIndex !== -1) {
    const nextLineIndex = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, nextLineIndex) + '\n' + importToAdd + content.slice(nextLineIndex);
  } else {
    content = importToAdd + '\n' + content;
  }
  
  fs.writeFileSync(fullPath, content);
  console.log('Processed', file);
});
