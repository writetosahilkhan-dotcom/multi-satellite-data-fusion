"""
AI Insights service using Google Gemini API
"""
import os
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

# Try to import Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ENABLE_AI_INSIGHTS = os.getenv("ENABLE_AI_INSIGHTS", "true").lower() == "true"

gemini_model = None
if GEMINI_AVAILABLE and GEMINI_API_KEY and ENABLE_AI_INSIGHTS:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('models/gemini-2.0-flash-exp')
        print("✓ AI Insights enabled with Gemini API")
    except Exception as e:
        print(f"⚠ Gemini API configuration failed: {e}")
        gemini_model = None
else:
    print("○ AI Insights disabled - No API key provided or Gemini not available")


def generate_environmental_insights(metadata: Dict, alerts: List, confidence: float) -> Dict[str, str]:
    """
    Generate AI insights for environmental risk analysis
    
    Args:
        metadata: Analysis metadata
        alerts: List of risk alerts
        confidence: Overall confidence score
    
    Returns:
        Dictionary with AI-generated insights
    """
    if not gemini_model:
        return {
            "summary": "AI insights not available. Configure GEMINI_API_KEY in .env file.",
            "interpretation": "Environmental risk analysis completed using multi-factor algorithms.",
            "recommendations": "• Monitor high-risk zones closely\n• Review alerts for detailed information\n• Check satellite data regularly",
            "risk_level_explanation": "Risk levels determined by water expansion, terrain slope, and rainfall intensity.",
            "ai_powered": False
        }
    
    try:
        region = metadata.get("region", "Unknown")
        total_alerts = metadata.get("total_alerts", 0)
        high_risk = metadata.get("high_risk_count", 0)
        medium_risk = metadata.get("medium_risk_count", 0)
        low_risk = metadata.get("low_risk_count", 0)
        total_area = metadata.get("total_risk_area_km2", 0)
        
        prompt = f"""Environmental risk assessment for {region}:
- Confidence: {confidence:.1f}%
- Total Alerts: {total_alerts} (HIGH: {high_risk}, MEDIUM: {medium_risk}, LOW: {low_risk})
- Affected Area: {total_area:.1f} km²

Provide concise analysis in this format:

SUMMARY:
[2-3 sentences summarizing the overall situation]

INTERPRETATION:
[3-4 sentences explaining what the data means]

RECOMMENDATIONS:
• [Action 1]
• [Action 2]
• [Action 3]

RISK_LEVEL_EXPLANATION:
[2 sentences explaining the risk assessment methodology]"""
        
        response = gemini_model.generate_content(prompt)
        ai_text = response.text
        
        # Parse response sections
        sections = {}
        current_section = None
        current_content = []
        
        for line in ai_text.split('\n'):
            line = line.strip()
            if line.startswith('SUMMARY:'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'summary'
                current_content = [line.replace('SUMMARY:', '').strip()]
            elif line.startswith('INTERPRETATION:'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'interpretation'
                current_content = [line.replace('INTERPRETATION:', '').strip()]
            elif line.startswith('RECOMMENDATIONS:'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'recommendations'
                current_content = []
            elif line.startswith('RISK_LEVEL_EXPLANATION:'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'risk_level_explanation'
                current_content = [line.replace('RISK_LEVEL_EXPLANATION:', '').strip()]
            elif line:
                current_content.append(line)
        
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()
        
        return {
            "summary": sections.get("summary", "Analysis in progress..."),
            "interpretation": sections.get("interpretation", ""),
            "recommendations": sections.get("recommendations", ""),
            "risk_level_explanation": sections.get("risk_level_explanation", ""),
            "ai_powered": True
        }
    
    except Exception as e:
        print(f"Error generating AI insights: {e}")
        return {
            "summary": f"Unable to generate AI insights: {str(e)}",
            "interpretation": "Analysis can still be viewed using the technical data provided.",
            "recommendations": "• Review the map and alerts for detailed risk information\n• Monitor affected areas\n• Check satellite data regularly",
            "risk_level_explanation": "Risk levels based on multi-factor analysis including water changes, terrain, and rainfall.",
            "ai_powered": False
        }


def generate_satellite_insights(satellites: List[Dict], fusion_metrics: Dict) -> Dict[str, str]:
    """
    Generate AI insights for satellite tracking analysis
    
    Args:
        satellites: List of satellites with telemetry
        fusion_metrics: Aggregated fusion metrics
    
    Returns:
        Dictionary with AI-generated insights
    """
    if not gemini_model:
        return {
            "summary": "AI insights not available.",
            "orbital_analysis": f"Tracking {len(satellites)} satellites across multiple orbits.",
            "coverage_assessment": f"Total coverage area: {fusion_metrics.get('total_coverage_area_km2', 0):,.0f} km²",
            "ai_powered": False
        }
    
    try:
        count = len(satellites)
        avg_alt = fusion_metrics.get("average_altitude_km", 0)
        coverage = fusion_metrics.get("total_coverage_area_km2", 0)
        accuracy = fusion_metrics.get("fusion_accuracy", 0)
        
        prompt = f"""Satellite tracking analysis:
- Active Satellites: {count}
- Average Altitude: {avg_alt:.1f} km
- Total Coverage: {coverage:,.0f} km²
- Fusion Accuracy: {accuracy:.1f}%

Provide brief analysis:
1. SUMMARY (1-2 sentences)
2. ORBITAL_ANALYSIS (2-3 sentences)
3. COVERAGE_ASSESSMENT (2 sentences)"""
        
        response = gemini_model.generate_content(prompt)
        ai_text = response.text
        
        # Simple parsing
        return {
            "summary": ai_text[:200] + "...",
            "orbital_analysis": f"Analyzing {count} satellites with average altitude {avg_alt:.1f}km.",
            "coverage_assessment": f"Coverage area of {coverage:,.0f} km² with {accuracy:.1f}% fusion accuracy.",
            "ai_powered": True
        }
    
    except Exception as e:
        print(f"Error generating satellite insights: {e}")
        return {
            "summary": f"Tracking {len(satellites)} satellites successfully.",
            "orbital_analysis": "Multi-satellite constellation providing comprehensive Earth observation coverage.",
            "coverage_assessment": f"Total coverage: {fusion_metrics.get('total_coverage_area_km2', 0):,.0f} km²",
            "ai_powered": False
        }
