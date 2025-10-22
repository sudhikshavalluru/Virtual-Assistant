// Simple AI Training System for Complaint Assistant
class SimpleAI {
    constructor() {
        this.trainingData = [];
        this.model = {
            patterns: new Map(),
            responses: new Map(),
            confidence: new Map()
        };
        this.isTraining = false;
    }

    // Add training data
    addTrainingData(input, expectedOutput, category) {
        this.trainingData.push({
            input: input.toLowerCase(),
            output: expectedOutput,
            category: category,
            timestamp: new Date()
        });
    }

    // Train the model
    train() {
        console.log('🧠 Starting AI Training...');
        this.isTraining = true;

        // Process training data
        this.trainingData.forEach((data, index) => {
            const words = data.input.split(' ');
            
            // Create patterns
            words.forEach(word => {
                if (word.length > 2) { // Ignore short words
                    if (!this.model.patterns.has(word)) {
                        this.model.patterns.set(word, []);
                    }
                    this.model.patterns.get(word).push({
                        category: data.category,
                        response: data.output,
                        weight: 1
                    });
                }
            });
        });

        // Calculate confidence scores
        this.model.patterns.forEach((patterns, word) => {
            const categoryCount = {};
            patterns.forEach(p => {
                categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
            });
            
            const total = patterns.length;
            const maxCategory = Object.keys(categoryCount).reduce((a, b) => 
                categoryCount[a] > categoryCount[b] ? a : b
            );
            
            this.model.confidence.set(word, {
                category: maxCategory,
                score: categoryCount[maxCategory] / total
            });
        });

        this.isTraining = false;
        console.log(`✅ Training Complete! Processed ${this.trainingData.length} examples`);
        console.log(`📊 Model contains ${this.model.patterns.size} word patterns`);
    }

    // Predict response
    predict(input) {
        const words = input.toLowerCase().split(' ');
        const scores = {};
        let totalConfidence = 0;

        words.forEach(word => {
            if (this.model.confidence.has(word)) {
                const confidence = this.model.confidence.get(word);
                scores[confidence.category] = (scores[confidence.category] || 0) + confidence.score;
                totalConfidence += confidence.score;
            }
        });

        if (totalConfidence === 0) {
            return {
                category: 'unknown',
                confidence: 0,
                response: 'I need more training data for this type of issue.'
            };
        }

        const bestCategory = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );

        const confidence = scores[bestCategory] / totalConfidence;
        
        // Get best response for category
        const categoryResponses = [];
        this.model.patterns.forEach(patterns => {
            patterns.forEach(p => {
                if (p.category === bestCategory) {
                    categoryResponses.push(p.response);
                }
            });
        });

        const response = categoryResponses[Math.floor(Math.random() * categoryResponses.length)] || 
                        'Let me help you with this issue.';

        return {
            category: bestCategory,
            confidence: Math.round(confidence * 100),
            response: response
        };
    }

    // Get training statistics
    getStats() {
        return {
            trainingExamples: this.trainingData.length,
            patterns: this.model.patterns.size,
            categories: [...new Set(this.trainingData.map(d => d.category))],
            isTraining: this.isTraining
        };
    }
}

// Initialize and train the AI
const aiModel = new SimpleAI();

// Training Data - Real technical support scenarios
const trainingExamples = [
    // Hardware Issues
    ['my computer wont turn on', 'Check power cable and press power button firmly. Try different power outlet.', 'hardware'],
    ['screen is black', 'Check monitor cable connections. Try different cable or monitor.', 'hardware'],
    ['keyboard not working', 'Try different USB port. Check if NumLock is on. Restart computer.', 'hardware'],
    ['mouse not responding', 'Check USB connection. Try different port. Replace batteries if wireless.', 'hardware'],
    ['printer not printing', 'Check printer power and paper. Clear print queue. Update printer drivers.', 'hardware'],
    
    // Software Issues
    ['application keeps crashing', 'Update the software. Clear application cache. Restart computer.', 'software'],
    ['software wont install', 'Run as administrator. Check system requirements. Disable antivirus temporarily.', 'software'],
    ['program running slow', 'Close other applications. Check available RAM. Update the software.', 'software'],
    ['cant open file', 'Check file format compatibility. Try different application. File might be corrupted.', 'software'],
    ['software freezing', 'Force close application. Check for updates. Restart in safe mode.', 'software'],
    
    // Network Issues
    ['no internet connection', 'Restart router and modem. Check cable connections. Contact ISP if needed.', 'network'],
    ['wifi not connecting', 'Forget and reconnect to network. Check password. Restart network adapter.', 'network'],
    ['slow internet speed', 'Run speed test. Restart router. Check for background downloads.', 'network'],
    ['cant access website', 'Try different browser. Clear browser cache. Check if site is down.', 'network'],
    ['email not working', 'Check internet connection. Verify email settings. Clear email cache.', 'network'],
    
    // Performance Issues
    ['computer running slow', 'Close unnecessary programs. Run disk cleanup. Check for malware.', 'performance'],
    ['system freezing', 'Check available disk space. Run memory diagnostic. Update drivers.', 'performance'],
    ['high cpu usage', 'Check Task Manager for resource-heavy processes. End unnecessary tasks.', 'performance'],
    ['low memory warning', 'Close unused applications. Clear temporary files. Add more RAM if needed.', 'performance'],
    ['computer overheating', 'Clean dust from fans. Check ventilation. Monitor CPU temperature.', 'performance'],
    
    // Login Issues
    ['forgot password', 'Use password reset option. Check email for reset link. Contact administrator.', 'login'],
    ['account locked', 'Wait for lockout period. Contact IT support. Try password reset.', 'login'],
    ['cant login', 'Check username and password. Ensure Caps Lock is off. Clear browser cache.', 'login'],
    ['two factor authentication not working', 'Check phone time settings. Try backup codes. Contact support.', 'login'],
    ['login page not loading', 'Clear browser cache. Try different browser. Check internet connection.', 'login']
];

// Add training data
trainingExamples.forEach(([input, output, category]) => {
    aiModel.addTrainingData(input, output, category);
});

// Train the model
aiModel.train();

// Export for use in chatbot
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiModel;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.trainedAI = aiModel;
}

console.log('🎓 AI Training Complete!');
console.log('📊 Training Statistics:', aiModel.getStats());