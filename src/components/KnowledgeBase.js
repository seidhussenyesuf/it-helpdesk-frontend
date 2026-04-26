// Knowledge Base System
const knowledgeBase = {
    'password reset': {
        solution: 'Please visit the password reset portal at https://portal.company.com/forgot-password and follow the instructions. If issues persist, contact IT support.',
        steps: [
            'Go to password reset portal',
            'Enter your email address',
            'Check email for reset link',
            'Create new password',
            'Login with new credentials'
        ],
        success_rate: 0.95,
        average_time: '5 minutes',
        category: 'Account'
    },
    'printer not working': {
        solution: 'Check printer connection and drivers. Follow these steps: 1. Ensure printer is powered on 2. Check network connection 3. Reinstall printer drivers 4. Test print',
        steps: [
            'Check power and cables',
            'Verify network connection',
            'Update printer drivers',
            'Clear print queue',
            'Test with different document'
        ],
        success_rate: 0.87,
        average_time: '15 minutes',
        category: 'Hardware'
    },
    'email configuration': {
        solution: 'Configure your email client with these settings: Server: mail.company.com, Port: 587, Security: TLS. Download configuration file from intranet.',
        steps: [
            'Download configuration file',
            'Open email client settings',
            'Import configuration',
            'Test send/receive',
            'Verify calendar sync'
        ],
        success_rate: 0.92,
        average_time: '10 minutes',
        category: 'Software'
    },
    'vpn connection': {
        solution: 'VPN connection issues can be resolved by updating the VPN client and checking firewall settings. Download latest client from https://vpn.company.com/download',
        steps: [
            'Update VPN client',
            'Check internet connection',
            'Disable firewall temporarily',
            'Use different server location',
            'Contact network team if persistent'
        ],
        success_rate: 0.78,
        average_time: '20 minutes',
        category: 'Network'
    }
};

// AI-powered solution suggester
function suggestSolutions(issueType, description) {
    const descriptionLower = description.toLowerCase();
    const suggestions = [];
    let confidence = 0;
    
    // Search knowledge base for matching keywords
    Object.entries(knowledgeBase).forEach(([keyword, solution]) => {
        if (descriptionLower.includes(keyword) || 
            solution.category.toLowerCase() === issueType.toLowerCase()) {
            
            const matchScore = calculateMatchScore(keyword, descriptionLower, issueType);
            
            suggestions.push({
                keyword,
                solution: solution.solution,
                steps: solution.steps,
                success_rate: solution.success_rate,
                average_time: solution.average_time,
                match_score: matchScore,
                confidence: (matchScore * 100).toFixed(1) + '%'
            });
            
            confidence = Math.max(confidence, matchScore);
        }
    });
    
    // Sort by match score
    suggestions.sort((a, b) => b.match_score - a.match_score);
    
    return {
        suggestions: suggestions.slice(0, 3), // Top 3 suggestions
        has_solutions: suggestions.length > 0,
        confidence: (confidence * 100).toFixed(1) + '%',
        total_found: suggestions.length
    };
}

function calculateMatchScore(keyword, description, issueType) {
    let score = 0;
    
    // Exact keyword match
    if (description.includes(keyword)) {
        score += 0.6;
    }
    
    // Partial match
    const words = keyword.split(' ');
    let partialMatches = 0;
    words.forEach(word => {
        if (description.includes(word) && word.length > 3) {
            partialMatches++;
        }
    });
    
    score += (partialMatches / words.length) * 0.4;
    
    return Math.min(score, 1);
}

// API endpoint for solution suggestions
app.get('/api/suggest-solutions', authenticateToken, async (req, res) => {
    try {
        const { issue_type, description } = req.query;
        
        if (!issue_type || !description) {
            return res.status(400).json({ 
                success: false, 
                message: 'Issue type and description are required' 
            });
        }
        
        const suggestions = suggestSolutions(issue_type, description);
        
        res.json({
            success: true,
            ...suggestions,
            message: suggestions.has_solutions ? 
                `Found ${suggestions.total_found} potential solutions` : 
                'No automated solutions found. A support agent will assist you.'
        });
        
    } catch (error) {
        console.error('Solution suggestion error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Save successful solutions to knowledge base
app.post('/api/save-solution', authenticateToken, requireSeniorOrAdmin, async (req, res) => {
    try {
        const { ticket_id, solution_key, solution_text, steps, category } = req.body;
        
        // Here you would save to a persistent database
        // For now, we'll add to runtime knowledge base
        if (solution_key && solution_text) {
            knowledgeBase[solution_key.toLowerCase()] = {
                solution: solution_text,
                steps: steps || [],
                success_rate: 0.85, // Default success rate
                average_time: '15 minutes', // Default time
                category: category || 'General'
            };
        }
        
        res.json({
            success: true,
            message: 'Solution added to knowledge base',
            total_solutions: Object.keys(knowledgeBase).length
        });
        
    } catch (error) {
        console.error('Save solution error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});