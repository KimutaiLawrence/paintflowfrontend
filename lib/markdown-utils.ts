/**
 * Utility functions for markdown field replacement
 */

export interface FieldValue {
  key: string
  value: any
  type: "text" | "date" | "time" | "select" | "checkbox" | "signature" | "image"
}

/**
 * Replace field placeholders in markdown with actual values
 */
export function replaceMarkdownFields(markdown: string, fields: Record<string, any>): string {
  let result = markdown

  // Helper to escape regex special characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  // Text field replacements (find patterns like `____________________________` or `____`)
  Object.entries(fields).forEach(([key, value]) => {
    if (!value && value !== 0 && value !== false) return

    // TBM fields
    if (key.startsWith("tbm_")) {
      if (key === "tbm_project_title" && value) {
        result = result.replace(/(\*\*Project Title:\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "tbm_date_meeting" && value) {
        result = result.replace(/(\*\*Date of Meeting:\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "tbm_time_from" && value) {
        result = result.replace(/(\*\*Time of Meeting:\*\* \| From) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "tbm_time_to" && value) {
        result = result.replace(/(\*\*Time of Meeting:\*\* \| From .* Hrs\. To) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "tbm_supervisor_name" && value) {
        result = result.replace(/(\*\*Name :\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "tbm_supervisor_signature" && value) {
        result = result.replace(/(\*\*Signature :\*\* \|) `[^`]*`/i, `$1 ![Signature](${value})`)
      }
      if (key === "tbm_supervisor_designation" && value) {
        result = result.replace(/(\*\*Designation :\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "tbm_supervisor_date" && value) {
        result = result.replace(/(\*\*Date :\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      // Employee rows
      const employeeMatch = key.match(/tbm_employee_(\d+)/)
      if (employeeMatch) {
        const rowNum = employeeMatch[1]
        if (fields[`${key}_name`]) {
          result = result.replace(
            new RegExp(`(\\| ${rowNum} \\|) \`[^\`]*\` (\\|) \`[^\`]*\` (\\|) \`[^\`]*\` (\\|)`, "i"),
            `$1 ${fields[`${key}_name`] || "`____________`"} $2 ${fields[`${key}_nric`] || "`____________`"} $3 ${fields[`${key}_company`] || "`____________`"} $4`
          )
        }
      }
    }

    // VSS fields
    if (key.startsWith("vss_")) {
      if (key === "vss_project_location" && value) {
        result = result.replace(/(\*\*Project\/ Location :\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "vss_contractor" && value) {
        result = result.replace(/(\*\*Contractor :\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "vss_ptw_no" && value) {
        result = result.replace(/(\*\*PTW No :\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "vss_serial_1" && value) {
        result = result.replace(/(\*\*VSS Serial No 1 :\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "vss_serial_2" && value) {
        result = result.replace(/(\*\*VSS Serial No 2 :\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "vss_serial_3" && value) {
        result = result.replace(/(\*\*VSS Serial No 3 :\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
    }

    // WAH fields
    if (key.startsWith("wah_")) {
      if (key === "wah_date" && value) {
        result = result.replace(/(\*\*DATE :\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "wah_location_block" && value) {
        result = result.replace(/(\*\*Location\/ Block\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "wah_wp_no" && value) {
        result = result.replace(/(\*\*WP No\. \(If applicable\)\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "wah_supervisor_name" && value) {
        result = result.replace(/(\*\*Name of Supervisor \/ Foreman\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "wah_supervisor_signature" && value) {
        result = result.replace(/(\*\*Signature\*\* \|) `[^`]*`/i, `$1 ![Signature](${value})`)
      }
      if (key === "wah_supervisor_date" && value) {
        result = result.replace(/(\*\*Date\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
    }

    // PTW fields
    if (key.startsWith("ptw_")) {
      if (key === "ptw_permit_no" && value) {
        result = result.replace(/(\*\*Permit No\.\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "ptw_project_title" && value) {
        result = result.replace(/(\*\*Project Title\*\* \|) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "ptw_task_description" && value) {
        result = result.replace(/(\*\*Task Description\*\*) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "ptw_location_wah" && value) {
        result = result.replace(/(\*\*Location of WAH\*\*) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "ptw_start_date" && value) {
        result = result.replace(/(\*\*Start Date\*\*) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "ptw_end_date" && value) {
        result = result.replace(/(\*\*End Date\*\*) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "ptw_num_supervisors" && value) {
        result = result.replace(/(\*\*No\. of Supervisor\*\*) `[^`]*`/i, `$1 ${value}`)
      }
      if (key === "ptw_num_workers" && value) {
        result = result.replace(/(\*\*No\. of Workers\*\*) `[^`]*`/i, `$1 ${value}`)
      }
      // Signatures
      if (key.endsWith("_signature") && value) {
        const sectionMatch = key.match(/ptw_(s\d|s5)_signature/)
        if (sectionMatch) {
          result = result.replace(
            new RegExp(`(\\*\\*Section ${sectionMatch[1].replace("s", "")}.*?\\*\\*.*?\\*\\*Signature:\\*\\* \\|) \`[^\`]*\``, "is"),
            `$1 ![Signature](${value})`
          )
        }
      }
    }

    // Checkbox replacements (replace ☐ with ☑)
    if (typeof value === "boolean") {
      // TBM subjects (1-20)
      if (key.startsWith("tbm_subject_")) {
        const subjectNum = key.replace("tbm_subject_", "")
        const subjectMap: Record<string, string> = {
          "1": "Overhead and falling object hazards",
          "2": "Falling from height hazard",
          "3": "Tripping & slipping hazards",
          "4": "Cutting & laceration hazards",
          "5": "Hazards involving corrosive substance",
          "6": "Eye protection",
          "7": "Respiratory protection",
          "8": "Hearing conservation",
          "9": "Inspection and use of personal protective equipment",
          "10": "Chemical hazard / SDS",
          "11": "Heat stress",
          "12": "Electrical hazard",
          "13": "Fire hazard",
          "14": "Hazards involving hot works",
          "15": "Safe operation of machinery",
          "16": "Registration, inspection, and usage of scaffold",
          "17": "Hazards involving lifting operation",
          "18": "Checking and clearing of stagnant water",
          "19": "Housekeeping",
          "20": "Dos & Don'ts",
        }
        const subjectName = subjectMap[subjectNum]
        if (subjectName) {
          const checkbox = value ? "☑" : "☐"
          // Match: | 1 | Overhead... | `☐` | or | 11 | Heat stress | `☐` |
          const pattern = new RegExp(`(\\| ${subjectNum} \\| ${escapeRegex(subjectName)} \\|) \`☐\``, "i")
          result = result.replace(pattern, `$1 \`${checkbox}\``)
        }
      }
    }
  })

  return result
}

/**
 * Extract field values from markdown (reverse operation)
 */
export function extractFieldValues(markdown: string): Record<string, any> {
  const values: Record<string, any> = {}

  // Extract project title
  const projectTitleMatch = markdown.match(/\*\*Project Title:\*\* \| ([^\n|]+)/i)
  if (projectTitleMatch) values.checklist = projectTitleMatch[1].trim()

  // Extract dates
  const dateMatch = markdown.match(/\*\*DATE :\*\* \| ([^\n|]+)/i)
  if (dateMatch) values.wah_date = dateMatch[1].trim()

  return values
}

