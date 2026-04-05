const { GoogleGenerativeAI } = require('@googleapis/generativeai');
const logger = require('../utils/logger');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function verifyBusiness(business) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a business data verifier for Iraqi businesses. Verify if this business information is realistic and consistent:

Business: ${business.name}
Category: ${business.category}
City: ${business.city}
Governorate: ${business.governorate}
Source: ${business.source}

Answer ONLY with a JSON object:
{
  "is_realistic": true/false,
  "confidence": 0.0-1.0,
  "issues": ["issue1", "issue2"] or []
}

Rules:
- Check if the business name makes sense for the category
- Check if the city is in the governorate
- Be lenient - most real businesses should pass
- Only flag obvious errors or hallucinations
- Do not add explanations, only JSON`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    let verification;
    try {
      verification = JSON.parse(text);
    } catch (error) {
      // Try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verification = JSON.parse(jsonMatch[0]);
      } else {
        // Default to passing if parsing fails
        verification = { is_realistic: true, confidence: 0.5, issues: [] };
      }
    }
    
    // Ensure required fields
    verification.is_realistic = verification.is_realistic !== false;
    verification.confidence = typeof verification.confidence === 'number' ? verification.confidence : 0.5;
    verification.issues = Array.isArray(verification.issues) ? verification.issues : [];
    
    return verification;
    
  } catch (error) {
    logger.error('Gemini verification error:', error);
    // Default to passing if verification fails
    return { is_realistic: true, confidence: 0.3, issues: ['verification_failed'] };
  }
}

async function verifyBusinesses(businesses) {
  logger.info(`🔍 Verifying ${businesses.length} businesses with Gemini`);
  
  const verifiedBusinesses = [];
  
  for (const business of businesses) {
    try {
      const verification = await verifyBusiness(business);
      
      if (verification.is_realistic) {
        verifiedBusinesses.push({
          ...business,
          confidence: verification.confidence,
          verification_status: verification.issues.length > 0 ? 'pending' : 'verified',
          verification_issues: verification.issues
        });
      } else {
        logger.debug(`❌ Business rejected: ${business.name} - ${verification.issues.join(', ')}`);
      }
    } catch (error) {
      logger.error(`Error verifying ${business.name}:`, error);
      // Include business anyway if verification fails
      verifiedBusinesses.push({
        ...business,
        confidence: 0.3,
        verification_status: 'pending',
        verification_issues: ['verification_error']
      });
    }
  }
  
  logger.info(`✅ Verified ${verifiedBusinesses.length}/${businesses.length} businesses`);
  
  return verifiedBusinesses;
}

module.exports = {
  verifyBusiness,
  verifyBusinesses
};
