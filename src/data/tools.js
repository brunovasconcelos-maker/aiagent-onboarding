import gmail from '../assets/logos/logos_google-gmail-2020.svg'
import googleCalendar from '../assets/logos/logos_google-calendar-2020.svg'
import googleDrive from '../assets/logos/logos_google-drive-2020.svg'
import googleSlides from '../assets/logos/selfhst_google-slides.svg'
import googleSheets from '../assets/logos/selfhst_google-sheets.svg'
import outlook from '../assets/logos/selfhst_microsoft-outlook.svg'
import hubspot from '../assets/logos/thesvg-color_hubspot.svg'
import pipedrive from '../assets/logos/thesvg-color_pipedrive.svg'
import salesforce from '../assets/logos/selfhst_salesforce.svg'

// Step 3 tools, in the order of the Figma grid (3 x 3).
//   label  card label with the line breaks of Figma (defaults to `name`)
//   size   logo size inside the card tile, in Figma px
//   orbit  logo size inside an orbit circle, in Figma px (circle = 121.569px). Calendar,
//          Slides and Salesforce are measured in Figma; the others use the same ratio
//          (about 2.04x the card size).
export const tools = [
  { id: 'gmail', name: 'Gmail', logo: gmail, size: [24, 18], orbit: [49, 36.75] },
  { id: 'google-calendar', name: 'Google Calendar', label: 'Google\nCalendar', logo: googleCalendar, size: [24, 24], orbit: [50, 50] },
  { id: 'google-drive', name: 'Google Drive', label: 'Google\nDrive', logo: googleDrive, size: [26.83, 24], orbit: [54.7, 49] },
  { id: 'google-slides', name: 'Google Slides', label: 'Google\nSlides', logo: googleSlides, size: [24, 24], orbit: [49, 49] },
  { id: 'google-sheets', name: 'Google Sheets', label: 'Google\nSheets', logo: googleSheets, size: [24, 24], orbit: [49, 49] },
  { id: 'outlook', name: 'Outlook', logo: outlook, size: [24, 24], orbit: [49, 49] },
  { id: 'hubspot', name: 'HubSpot', logo: hubspot, size: [24, 24], orbit: [49, 49] },
  { id: 'pipedrive', name: 'Pipedrive', logo: pipedrive, size: [24, 24], orbit: [49, 49] },
  { id: 'salesforce', name: 'Salesforce', logo: salesforce, size: [24, 24], orbit: [48.33, 48.33] },
]

export const getTool = (id) => tools.find((tool) => tool.id === id) ?? null
