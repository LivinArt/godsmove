const fs = require('fs');
const path = require('path');

const files = [
  'src/actions/wallet.actions.ts',
  'src/actions/return.actions.ts',
  'src/actions/product.actions.ts',
  'src/actions/order.actions.ts',
  'src/actions/editorial.actions.ts',
  'src/actions/drop.actions.ts',
  'src/actions/discount.actions.ts',
];

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has bypass
  if (content.includes('hasAdminBypass')) continue;

  // Add import at the top
  if (!content.includes('import { hasAdminBypass }')) {
    content = content.replace(/(import.*?;)/, "$1\nimport { hasAdminBypass } from '@/lib/admin-auth';");
  }

  // Replace requireAdmin or requireAdminOrEditor
  content = content.replace(
    /async function requireAdmin(?:OrEditor)?\(\) \{([\s\S]*?)const supabase = await createClient\(\);([\s\S]*?)const \{[\s\S]*?\} = await supabase.auth.getUser\(\);([\s\S]*?)if \(\!user\) throw new Error\('UNAUTHORIZED'\);/m,
    (match, p1, p2, p3) => {
      const funcName = match.includes('requireAdminOrEditor') ? 'requireAdminOrEditor' : 'requireAdmin';
      return `async function ${funcName}() {${p1}const bypass = await hasAdminBypass();\n  const supabase = await createClient();${p2}const { data: { user } } = await supabase.auth.getUser();${p3}\n  if (bypass) return user || { id: 'bypass-admin', email: 'admin@godsmove.in' } as any;\n\n  if (!user) throw new Error('UNAUTHORIZED');`;
    }
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
