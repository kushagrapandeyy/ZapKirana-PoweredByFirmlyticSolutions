const fs = require('fs');
const path = 'app-consumer/src/app/onboarding.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import LottieView')) {
  content = content.replace("import Animated,", "import LottieView from 'lottie-react-native';\nimport Animated,");
}

const logoBadgeRegex = /<View style=\{styles\.logoBadge\}>[\s\S]*?<\/View>/;
const replacement = `
            <View style={[styles.logoBadge, { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }]}>
              <LottieView
                autoPlay
                loop
                style={{ width: 150, height: 150 }}
                source={require('../../assets/lottie/intro.lottie')}
              />
            </View>
`;

content = content.replace(logoBadgeRegex, replacement.trim());

fs.writeFileSync(path, content, 'utf8');
console.log('Updated Lottie integration in onboarding.tsx');
