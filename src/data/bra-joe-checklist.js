/**
 * Bra Joe's Official Building Plan Check List
 * DOC NO: EDSP/BPM/OP 7.5.1/1/9
 * Rev 5 — Tshwane Municipality
 * Economic Development and Spatial Planning: Building Plans Management
 *
 * 68+ compliance items across 6 sections
 * Each item maps to a SANS 10400 clause and a municipal department
 *
 * AI auto-checkable = items where PDF text extraction can yield measurable values
 * (dimensions, percentages, counts, presence of specific elements)
 */

const BRA_JOE_CHECKLIST = {

  sections: [
    { id: 'GENERAL',       label: 'GENERAL',        icon: '📋', itemCount: 24 },
    { id: 'SITE_PLAN',    label: 'SITE PLAN',       icon: '🗺️', itemCount: 8  },
    { id: 'FLOOR_PLANS',  label: 'FLOOR PLANS',     icon: '🏗️',  itemCount: 8  },
    { id: 'SECTIONS',     label: 'SECTIONS & DETAILS', icon: '📐', itemCount: 10 },
    { id: 'ELEVATIONS',   label: 'ELEVATIONS',      icon: '🏙️', itemCount: 4  },
    { id: 'DRAINAGE',     label: 'DRAINAGE PLANS',  icon: '🔍', itemCount: 14 },
    { id: 'CIRCULATION',  label: 'CIRCULATE TO DEPARTMENTS', icon: '📬', itemCount: 10 },
  ],

  /**
   * AI auto-checkable fields map to regex patterns in sans-analyzer.js
   * measured_field = which field to extract from PDF text
   * required_value = minimum/maximum requirement
   */
  items: [

    // ============================================================
    // SECTION 1: GENERAL (24 items)
    // ============================================================

    {
      id: 'GEN-01',
      section: 'GENERAL',
      item_number: 1,
      description: 'Municipal Application Form',
      requirement: 'SANS 10400 A, Form 1, Completed by Competent Person',
      responsible: 'Applicant / QP',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Form 1 must be fully completed, signed and dated'
    },
    {
      id: 'GEN-02',
      section: 'GENERAL',
      item_number: 2,
      description: 'Additional Fees / Building Line Relaxation',
      requirement: 'SANS 10400 A, Form 2, Completed by Competent Person/s or Engineer',
      responsible: 'Engineer',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Form 2 required for relaxation applications'
    },
    {
      id: 'GEN-03',
      section: 'GENERAL',
      item_number: 3,
      description: 'Title Block Description',
      requirement: 'Complete and correct — show scales on building plans, correctly drawn to scale',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'scale',
      required_value: 'Valid scale ratio (e.g., 1:100, 1:200)',
      guidance: 'Check title block shows scale, drawing name, date, architect details'
    },
    {
      id: 'GEN-04',
      section: 'GENERAL',
      item_number: 4,
      description: 'New / Existing Areas & Coverage (%) Indicated on Building Plans',
      requirement: 'Coverage percentage must be calculated and indicated',
      responsible: 'QP',
      department_code: 'RSP',
      ai_auto_checkable: true,
      measured_field: 'coverage_pct',
      required_value: 'Max 60% for Residential 1 (Tshwane Scheme)',
      guidance: 'Extract coverage % from site plan calculations'
    },
    {
      id: 'GEN-05',
      section: 'GENERAL',
      item_number: 5,
      description: 'Building Plans Signed & Dated by Owner and Author',
      requirement: 'Both owner and architect/professional must sign and date',
      responsible: 'Owner / QP',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Look for signature blocks with dates on all plan sheets'
    },
    {
      id: 'GEN-06',
      section: 'GENERAL',
      item_number: 6,
      description: 'Copy of Title Deed / SG Diagram / Zoning / Annexure T',
      requirement: 'All four documents must be provided',
      responsible: 'Applicant',
      department_code: 'RSP',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Verify zoning certificate matches application type and erf details'
    },
    {
      id: 'GEN-07',
      section: 'GENERAL',
      item_number: 7,
      description: 'Approval Letter from Body Corporate / Duet / Sectional Title',
      requirement: 'Required for sectional title developments',
      responsible: 'Applicant',
      department_code: 'RSP',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'N/A for freehold properties; required for sectional title'
    },
    {
      id: 'GEN-08',
      section: 'GENERAL',
      item_number: 8,
      description: 'Power of Attorney',
      requirement: 'Required if owner is not the applicant',
      responsible: 'Applicant',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Must be notarized and specific to this application'
    },
    {
      id: 'GEN-09',
      section: 'GENERAL',
      item_number: 9,
      description: 'One Copy of Building Plans Coloured — New Work',
      requirement: 'New additions must be coloured to distinguish from existing structures',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Typically red for new work, black for existing'
    },
    {
      id: 'GEN-10',
      section: 'GENERAL',
      item_number: 10,
      description: 'Title Deed Restriction',
      requirement: 'Any restrictions must be noted and complied with',
      responsible: 'QP',
      department_code: 'RSP',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Check title deed for deed restrictions, servitudes, etc.'
    },
    {
      id: 'GEN-11',
      section: 'GENERAL',
      item_number: 11,
      description: 'Calculation of Theoretical Annual Energy Consumption',
      requirement: 'SANS 10400-XA energy efficiency calculations',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Required for all new buildings; shows thermal performance compliance'
    },
    {
      id: 'GEN-12',
      section: 'GENERAL',
      item_number: 12,
      description: 'Proof of Registration with SACAP, ECSA or SACNSP',
      requirement: 'Professional must be registered with relevant body',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'SACAP for architects, ECSA for engineers, SACNSP for surveyors'
    },
    {
      id: 'GEN-13',
      section: 'GENERAL',
      item_number: 13,
      description: 'Second Dwelling Consent',
      requirement: 'Municipal consent required for second dwelling units',
      responsible: 'Applicant',
      department_code: 'RSP',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Check zoning conditions for granny flat / second dwelling rights'
    },
    {
      id: 'GEN-14',
      section: 'GENERAL',
      item_number: 14,
      description: 'Provide Drainage Connection Slip',
      requirement: 'Confirmation of municipal drainage connection availability',
      responsible: 'Applicant',
      department_code: 'WS',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Obtained from Water and Sanitation department'
    },
    {
      id: 'GEN-15',
      section: 'GENERAL',
      item_number: 15,
      description: 'Provide Copy of Recent Municipal Service Account',
      requirement: 'Recent account (within 3 months) showing no outstanding debts',
      responsible: 'Applicant',
      department_code: 'TRES',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Treasury clearance required before approval'
    },
    {
      id: 'GEN-16',
      section: 'GENERAL',
      item_number: 16,
      description: 'Provide Approved Building Plan — Lapa / Pool / Structure / Outbuilding',
      requirement: 'Previous approval letters for any existing structures on ERF',
      responsible: 'Applicant',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'All structures on the property must have approval history checked'
    },
    {
      id: 'GEN-17',
      section: 'GENERAL',
      item_number: 17,
      description: 'Subdivision / Consolidation',
      requirement: 'If applicable, proof of subdivision or consolidation approval',
      responsible: 'Applicant',
      department_code: 'RSP',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'N/A for single erf applications'
    },
    {
      id: 'GEN-18',
      section: 'GENERAL',
      item_number: 18,
      description: 'Home Undertaking (Max 60 m²)',
      requirement: 'Second dwelling must not exceed 60m² unless approved otherwise',
      responsible: 'QP',
      department_code: 'RSP',
      ai_auto_checkable: true,
      measured_field: 'second_dwelling_area',
      required_value: 'Max 60 m²',
      guidance: 'Measured from floor plan square meterage'
    },
    {
      id: 'GEN-19',
      section: 'GENERAL',
      item_number: 19,
      description: 'Habitable Outbuilding (max 20% and 50m²)',
      requirement: 'Outbuilding habitable rooms max 20% of main dwelling or 50m²',
      responsible: 'QP',
      department_code: 'RSP',
      ai_auto_checkable: true,
      measured_field: 'outbuilding_area',
      required_value: 'Max 50m² and 20% of main dwelling',
      guidance: 'Check zoning conditions for outbuilding rights'
    },
    {
      id: 'GEN-20',
      section: 'GENERAL',
      item_number: 20,
      description: 'Total Outbuildings (max 50%)',
      requirement: 'Combined outbuilding area max 50% of main dwelling',
      responsible: 'QP',
      department_code: 'RSP',
      ai_auto_checkable: true,
      measured_field: 'total_outbuilding_pct',
      required_value: 'Max 50% of main dwelling area',
      guidance: 'Sum all outbuildings — garage, shed, servant quarters, etc.'
    },
    {
      id: 'GEN-21',
      section: 'GENERAL',
      item_number: 21,
      description: 'Permission — Second Kitchen / Coverage / Height / Building Line',
      requirement: 'Relaxation approvals where applicable',
      responsible: 'QP',
      department_code: 'RSP',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Check if any relaxations have been applied for and approved'
    },
    {
      id: 'GEN-22',
      section: 'GENERAL',
      item_number: 22,
      description: 'Drainage Connection Slip',
      requirement: 'Municipal drainage connection confirmation',
      responsible: 'Applicant',
      department_code: 'WS',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'From Water and Sanitation — confirm capacity available'
    },
    {
      id: 'GEN-23',
      section: 'GENERAL',
      item_number: 23,
      description: 'Show Scales on Building Plans',
      requirement: 'All drawings must have a correct, legible scale bar or ratio',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'scale',
      required_value: 'Standard architectural scale (1:50, 1:100, 1:200)',
      guidance: 'Extract scale from title block or drawing annotation'
    },
    {
      id: 'GEN-24',
      section: 'GENERAL',
      item_number: 24,
      description: 'Calculations — Coverage, Floor Area, Outbuildings',
      requirement: 'All calculations must be shown on plans',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'calculations_shown',
      required_value: 'Coverage, FAR, and area calculations annotated on plans',
      guidance: 'Look for coverage calculation tables, area schedules on site plan'
    },

    // ============================================================
    // SECTION 2: SITE PLAN (8 items)
    // ============================================================

    {
      id: 'SITE-01',
      section: 'SITE_PLAN',
      item_number: 1,
      description: 'Indicate Street Name and Number',
      requirement: 'Street name and number must be clearly shown',
      responsible: 'QP',
      department_code: 'RSW',
      ai_auto_checkable: true,
      measured_field: 'street_address',
      required_value: 'Valid street name and number indicated',
      guidance: 'Check site plan annotation for street identification'
    },
    {
      id: 'SITE-02',
      section: 'SITE_PLAN',
      item_number: 2,
      description: 'Indicate Vehicle Entrance (No Obstruction)',
      requirement: 'Vehicle access must be clear and unobstructed per municipal standards',
      responsible: 'QP',
      department_code: 'TI',
      ai_auto_checkable: true,
      measured_field: 'vehicle_entrance',
      required_value: 'Minimum 3.5m width for single driveway',
      guidance: 'Check driveway width annotation and clearance from intersections'
    },
    {
      id: 'SITE-03',
      section: 'SITE_PLAN',
      item_number: 3,
      description: 'Show Building Lines / Servitudes (Scheme / Annexure T / Title Deed)',
      requirement: 'All building lines and servitudes must be indicated and respected',
      responsible: 'QP',
      department_code: 'RSP',
      ai_auto_checkable: true,
      measured_field: 'building_line_distance',
      required_value: 'As per zoning scheme — typically 1.5m sides, 3m street frontage',
      guidance: 'Extract building line dimensions from site plan'
    },
    {
      id: 'SITE-04',
      section: 'SITE_PLAN',
      item_number: 4,
      description: 'Show North Point / ERF Number / Adjacent ERF Numbers',
      requirement: 'All three must be clearly indicated on site plan',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'north_point_erf',
      required_value: 'North arrow, erf number, adjacent erf numbers',
      guidance: 'Standard drawing annotation — check for compass rose and erf labels'
    },
    {
      id: 'SITE-05',
      section: 'SITE_PLAN',
      item_number: 5,
      description: 'Show Planning Schedule (Scheme / Annexure T)',
      requirement: 'Zoning and planning conditions summary schedule required',
      responsible: 'QP',
      department_code: 'RSP',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Annexure T schedule of rights and restrictions for the ERF'
    },
    {
      id: 'SITE-06',
      section: 'SITE_PLAN',
      item_number: 6,
      description: 'Show Distance to Boundaries / Between Buildings (1m min)',
      requirement: 'Minimum 1m between buildings; distances to all boundaries shown',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'boundary_distances',
      required_value: 'Min 1m between buildings, distances to all boundaries annotated',
      guidance: 'Extract dimension annotations from site plan — check all setback distances'
    },
    {
      id: 'SITE-07',
      section: 'SITE_PLAN',
      item_number: 7,
      description: 'Show New & Existing Buildings Clearly Labelled',
      requirement: 'All structures labelled as NEW or EXISTING',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'new_existing_labels',
      required_value: 'All buildings labelled NEW/EXISTING/DEMOLISH',
      guidance: 'Check drawing annotations — all structures must have status labels'
    },
    {
      id: 'SITE-08',
      section: 'SITE_PLAN',
      item_number: 8,
      description: 'Show Position and Depth of Municipal Drainage Connection',
      requirement: 'Municipal sewer connection point must be shown with invert level',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'drainage_connection_depth',
      required_value: 'Invert level min 450mm from surface (SANS 10400-P)',
      guidance: 'Check drainage plan for connection point and depth annotation'
    },

    // ============================================================
    // SECTION 3: FLOOR PLANS (8 items)
    // ============================================================

    {
      id: 'FLR-01',
      section: 'FLOOR_PLANS',
      item_number: 1,
      description: 'Dimension and Specify Use of All Rooms',
      requirement: 'Every room must have dimensions AND use label',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'room_dimensions',
      required_value: 'All rooms labelled with dimensions and use (bedroom, lounge, etc.)',
      guidance: 'Extract room labels and dimension annotations from floor plans'
    },
    {
      id: 'FLR-02',
      section: 'FLOOR_PLANS',
      item_number: 2,
      description: 'Show Hot and Cold Water Layout and Calculations',
      requirement: 'Water layout must be shown with pipe sizes and connections',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Plumbing plan or annotation showing hot/cold water layout'
    },
    {
      id: 'FLR-03',
      section: 'FLOOR_PLANS',
      item_number: 3,
      description: 'Show Section Lines',
      requirement: 'All cross-section locations must be marked on floor plans',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'section_lines',
      required_value: 'Section lines with notation (e.g., A-A, B-B) matching section drawings',
      guidance: 'Extract section line annotations and match to section drawings'
    },
    {
      id: 'FLR-04',
      section: 'FLOOR_PLANS',
      item_number: 4,
      description: 'Size of Habitable Room (min 6m² / 2m)',
      requirement: 'Habitable rooms minimum 6m² floor area and 2m minimum height',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'habitable_room_size',
      required_value: 'Min 6m² floor area AND min 2m clear height',
      guidance: 'Extract room dimensions — check habitable rooms meet minimums'
    },
    {
      id: 'FLR-05',
      section: 'FLOOR_PLANS',
      item_number: 5,
      description: 'Chimney as per Part V of NBR',
      requirement: 'Chimney details must comply with SANS 10400-V',
      responsible: 'QP',
      department_code: 'FS',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Describe chimney construction, fire rating, and termination on plan'
    },
    {
      id: 'FLR-06',
      section: 'FLOOR_PLANS',
      item_number: 6,
      description: 'Fire Walls / Fire Doors / Fire Safety Distance (min 1m)',
      requirement: 'SANS 10400-B fire compartmentation requirements',
      responsible: 'QP',
      department_code: 'FS',
      ai_auto_checkable: true,
      measured_field: 'fire_safety_distance',
      required_value: 'Min 1m between buildings or fire-rated wall between units',
      guidance: 'Check for fire wall notation, fire door schedule, and distance annotations'
    },
    {
      id: 'FLR-07',
      section: 'FLOOR_PLANS',
      item_number: 7,
      description: 'Facilities for Disabled Persons (Toilet / Parking / Ramp)',
      requirement: 'SANS 10400-B requirements for accessible design',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Accessible parking bay, toilet, and ramp required for commercial/multi-unit'
    },
    {
      id: 'FLR-08',
      section: 'FLOOR_PLANS',
      item_number: 8,
      description: 'Ventilation (5%) and Lighting (10%) in Habitable Rooms',
      requirement: 'SANS 10400-G: min 5% openable for ventilation, 10% for lighting',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'window_area_pct',
      required_value: 'Min 5% openable window area, min 10% total glazing for light',
      guidance: 'Extract window dimensions and calculate % of floor area'
    },

    // ============================================================
    // SECTION 4: SECTIONS & DETAILS (10 items)
    // ============================================================

    {
      id: 'SEC-01',
      section: 'SECTIONS',
      item_number: 1,
      description: 'Show Sections as Marked on Building Plan',
      requirement: 'All section cuts shown on plan must have corresponding section drawings',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'section_drawings',
      required_value: 'Section drawings match section line locations on floor plans',
      guidance: 'Match section notation (A-A, B-B) between floor plan and section drawings'
    },
    {
      id: 'SEC-02',
      section: 'SECTIONS',
      item_number: 2,
      description: 'Foundations / Roof not to Encroach Boundary (detail)',
      requirement: 'All structural elements must be within erf boundaries',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'foundation_encroachment',
      required_value: 'No structural encroachment beyond boundary or into servitudes',
      guidance: 'Check foundation and roof overhang annotations against boundary lines'
    },
    {
      id: 'SEC-03',
      section: 'SECTIONS',
      item_number: 3,
      description: 'Show Ceiling Heights as per NBR Part C, Table 2',
      requirement: 'Min 2400mm for habitable rooms, 2100mm for non-habitable',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'ceiling_height',
      required_value: 'Min 2400mm habitable, 2100mm non-habitable, 2100mm passage',
      guidance: 'Extract ceiling height annotation from section drawings'
    },
    {
      id: 'SEC-04',
      section: 'SECTIONS',
      item_number: 4,
      description: 'Foundations / Internal Foundations / Floor Thickening Sizes',
      requirement: 'Foundation design must be shown with dimensions',
      responsible: 'Engineer',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'foundation_size',
      required_value: 'Foundation dimensions, concrete strength (min 25MPa), soil class',
      guidance: 'Extract foundation schedule, concrete grade, and soil classification'
    },
    {
      id: 'SEC-05',
      section: 'SECTIONS',
      item_number: 5,
      description: 'Pool Safety (SABS 1390) Self-Closing & Locking Gate',
      requirement: 'Pool safety barrier required; gate must be self-closing and self-latching',
      responsible: 'QP',
      department_code: 'FS',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Required if pool depth > 400mm; gate latch height min 1.5m'
    },
    {
      id: 'SEC-06',
      section: 'SECTIONS',
      item_number: 6,
      description: 'Min. Stair Headroom 2.1m / Stair Width / Size of Landing',
      requirement: 'SANS 10400-D: headroom min 2100mm, residential width min 900mm',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'stair_dimensions',
      required_value: 'Min 2100mm headroom, 900mm width, 900mm landing length',
      guidance: 'Extract stair section showing headroom, width, and landing dimensions'
    },
    {
      id: 'SEC-07',
      section: 'SECTIONS',
      item_number: 7,
      description: 'Pitch / Waterproofing under 26° / Roofing Material',
      requirement: 'Roof pitch, waterproofing details, and material specification',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Section detail should show roof pitch, waterproofing membrane, and material'
    },
    {
      id: 'SEC-08',
      section: 'SECTIONS',
      item_number: 8,
      description: 'Truss Sizes / Grade / Spacing / Span',
      requirement: "Truss schedule or engineer's certificate required",
      responsible: 'Engineer',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: "Engineer's certificate for roof structure; timber grade and spacing shown"
    },
    {
      id: 'SEC-09',
      section: 'SECTIONS',
      item_number: 9,
      description: 'Boundary / Screen Wall Details & Dimensions / Engineer Certificate',
      requirement: 'Boundary walls require detail drawings and engineer certification',
      responsible: 'Engineer',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Check for boundary wall detail drawing and professional sign-off'
    },
    {
      id: 'SEC-10',
      section: 'SECTIONS',
      item_number: 10,
      description: 'Safety Glass at Stairs (Window below 1.8m)',
      requirement: 'SANS 10400-N: safety glass or guarding for windows within 1.8m of floor',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Check window schedule for safety glass notation near stairs'
    },

    // ============================================================
    // SECTION 5: ELEVATIONS (4 items)
    // ============================================================

    {
      id: 'ELV-01',
      section: 'ELEVATIONS',
      item_number: 1,
      description: 'Provide Relevant / Correct Elevations',
      requirement: 'All four elevations (front, back, left, right) required',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'elevation_count',
      required_value: 'All four elevations drawn and labelled',
      guidance: 'Check drawing index — should have N, S, E, W elevation drawings'
    },
    {
      id: 'ELV-02',
      section: 'ELEVATIONS',
      item_number: 2,
      description: 'Specify All Finishes on Elevations / Show Natural Ground Levels',
      requirement: 'All finishes annotated (brick, paint, cladding) and NGL indicated',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'finish_specifications',
      required_value: 'Finish schedule on elevations + NGL annotation',
      guidance: 'Extract finish annotations from elevation drawings — check for NGL line'
    },
    {
      id: 'ELV-03',
      section: 'ELEVATIONS',
      item_number: 3,
      description: 'Window and Door Schedule',
      requirement: 'All windows and doors numbered and scheduled with sizes',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: true,
      measured_field: 'window_door_schedule',
      required_value: 'Window/door schedule with type, size, glazing spec, and hardware',
      guidance: 'Extract window schedule table — check sizes match elevation annotations'
    },
    {
      id: 'ELV-04',
      section: 'ELEVATIONS',
      item_number: 4,
      description: 'Markings on Transparent Glazing',
      requirement: 'SANS 10400-N: manifestations (dots/stripes) required on large glass panels',
      responsible: 'QP',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Check window schedule or elevation for manifestation marking notes'
    },

    // ============================================================
    // SECTION 6: DRAINAGE PLANS (14 items)
    // ============================================================

    {
      id: 'DRN-01',
      section: 'DRAINAGE',
      item_number: 1,
      description: 'Show Sanitary Fixtures and Sanitary Schedule',
      requirement: 'All sanitary ware (toilets, basins, showers) must be shown and scheduled',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'sanitary_fixtures',
      required_value: 'Fixture schedule with count matching drainage plan',
      guidance: 'Extract sanitary fixture count and verify against drainage layout'
    },
    {
      id: 'DRN-02',
      section: 'DRAINAGE',
      item_number: 2,
      description: 'Describe Vent Pipes / Vent Valves and Sizes on Layout Plan',
      requirement: 'SANS 10400-P: vent pipes must be shown with diameter',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'vent_pipe_sizes',
      required_value: 'Vent pipe diameter annotated (min 75mm for soil stacks)',
      guidance: 'Extract vent pipe annotations from drainage plan'
    },
    {
      id: 'DRN-03',
      section: 'DRAINAGE',
      item_number: 3,
      description: 'Show R.E\'s, I.E.\'s, A.E.\'s & Access Panel',
      requirement: 'Rodding eyes (R.E.), inspection eyes (I.E.), access eyes (A.E.) shown',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Check drainage plan for R.E., I.E., A.E. symbols at all junctions'
    },
    {
      id: 'DRN-04',
      section: 'DRAINAGE',
      item_number: 4,
      description: 'Indicate Drainage Invert Level (min 450mm) on Layout Plan',
      requirement: 'SANS 10400-P: min 450mm invert level from surface',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'invert_level',
      required_value: 'Min 450mm depth from finished ground level to pipe obvert',
      guidance: 'Extract invert level annotations — check minimum 450mm depth'
    },
    {
      id: 'DRN-05',
      section: 'DRAINAGE',
      item_number: 5,
      description: 'Provide One Gulley per System at Lowest Point',
      requirement: 'Each drainage system must have a gully at the lowest point',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'gully_count',
      required_value: 'Minimum 1 gully per drainage system at lowest invert',
      guidance: 'Verify gully exists at lowest point of each system'
    },
    {
      id: 'DRN-06',
      section: 'DRAINAGE',
      item_number: 6,
      description: 'Show Gradient of Drainage on Layout Plan',
      requirement: 'SANS 10400-P: minimum gradients for self-cleansing (1:40 to 1:80)',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'drainage_gradient',
      required_value: 'Gradient annotated (min 1.5% or 1:66 for 100mm pipe)',
      guidance: 'Extract gradient notation from drainage plan — check against pipe size'
    },
    {
      id: 'DRN-07',
      section: 'DRAINAGE',
      item_number: 7,
      description: 'Show Drainage Pipes / Wastepipes and Sizes — Colour Coded',
      requirement: 'Pipe sizes annotated and colour-coded per SANS standard',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'pipe_sizes',
      required_value: 'Pipe diameter annotated (100mm soil, 50mm waste minimum)',
      guidance: 'Extract pipe size labels — verify against drainage calculations'
    },
    {
      id: 'DRN-08',
      section: 'DRAINAGE',
      item_number: 8,
      description: 'Type of Drainage Material to be Used / Distance from Building',
      requirement: 'Material type noted and min distance from building foundation',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'drainage_material_distance',
      required_value: 'Min 1m from building foundation (SANS 10400-P)',
      guidance: 'Check material specification and distance annotations'
    },
    {
      id: 'DRN-09',
      section: 'DRAINAGE',
      item_number: 9,
      description: 'Provide R.E. / C.E. at Max 25m Distances',
      requirement: 'SANS 10400-P: rodding eye every max 25m on straight runs',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 're_ce_spacing',
      required_value: 'Max 25m between R.E./C.E. access points',
      guidance: 'Verify spacing of R.E./C.E. symbols on drainage run — measure from plan'
    },
    {
      id: 'DRN-10',
      section: 'DRAINAGE',
      item_number: 10,
      description: 'Provide R.E. / C.E. at 1500mm from Municipal Sewer Connection',
      requirement: 'Access point required within 1.5m of municipal connection',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'connection_access',
      required_value: 'R.E./C.E. within 1500mm of municipal sewer connection point',
      guidance: 'Check distance from municipal connection to first R.E./C.E. manhole'
    },
    {
      id: 'DRN-11',
      section: 'DRAINAGE',
      item_number: 11,
      description: 'Provide Covered Refuse Area (Water Inlet / Grease Trap)',
      requirement: 'Refuse area must be covered with water inlet and grease trap for food premises',
      responsible: 'QP',
      department_code: 'WM',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Commercial/food premises require grease trap; residential requires refuse area'
    },
    {
      id: 'DRN-12',
      section: 'DRAINAGE',
      item_number: 12,
      description: 'Septic Tank / French Drain — Min 5m from Any Building',
      requirement: 'SANS 10400-P/Q: min 5m horizontal distance from any building',
      responsible: 'Engineer',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'septic_building_distance',
      required_value: 'Min 5m from any building (obvert of tank/drain to building wall)',
      guidance: 'Extract septic tank/French drain position and measure to nearest building'
    },
    {
      id: 'DRN-13',
      section: 'DRAINAGE',
      item_number: 13,
      description: 'Septic Tank / French Drain — Min 45m from Water Source or Property Boundary',
      requirement: 'SANS 10400-P/Q: min 45m from borehole, well, spring, or stream',
      responsible: 'Engineer',
      department_code: 'WS',
      ai_auto_checkable: true,
      measured_field: 'septic_water_distance',
      required_value: 'Min 45m from any water source or property boundary',
      guidance: 'Verify septic system position against water source and boundary distances'
    },
    {
      id: 'DRN-14',
      section: 'DRAINAGE',
      item_number: 14,
      description: 'Describe Hot Water Heating System',
      requirement: 'Hot water system must be described (geyser, solar, heat pump)',
      responsible: 'QP',
      department_code: 'WS',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Extract HWC system description — solar, heat pump, or electric geyser'
    },

    // ============================================================
    // SECTION 7: CIRCULATE TO DEPARTMENTS (10 items — routing only)
    // These items track which departments must review the application
    // ============================================================

    {
      id: 'CIRC-01',
      section: 'CIRCULATION',
      item_number: 1,
      description: 'Regional Spatial Planning / LUMA',
      requirement: 'Circulate for land use and spatial planning comment',
      responsible: 'RSP / LUMA',
      department_code: 'RSP',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Land use, zoning compliance, density, bulk (coverage, FAR, height)'
    },
    {
      id: 'CIRC-02',
      section: 'CIRCULATION',
      item_number: 2,
      description: 'Water and Sanitation',
      requirement: 'Circulate for water and sewerage connection capacity',
      responsible: 'WS',
      department_code: 'WS',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Water connection size, sewer connection capacity, drainage compliance'
    },
    {
      id: 'CIRC-03',
      section: 'CIRCULATION',
      item_number: 3,
      description: 'Fire Department',
      requirement: 'Circulate for fire safety compliance comment',
      responsible: 'FS',
      department_code: 'FS',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Fire safety, means of egress, fire extinguisher positions, access for fire brigade'
    },
    {
      id: 'CIRC-04',
      section: 'CIRCULATION',
      item_number: 4,
      description: 'Waste Management',
      requirement: 'Circulate for waste management comment',
      responsible: 'WM',
      department_code: 'WM',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Refuse area, collection point access, recycling facilities'
    },
    {
      id: 'CIRC-05',
      section: 'CIRCULATION',
      item_number: 5,
      description: 'Traffic Engineering',
      requirement: 'Circulate for traffic and access impact comment',
      responsible: 'TI',
      department_code: 'TI',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Driveway visibility splays, parking, traffic impact for commercial/industrial'
    },
    {
      id: 'CIRC-06',
      section: 'CIRCULATION',
      item_number: 6,
      description: 'Environmental Planning & Open Space Management',
      requirement: 'Circulate for environmental comment',
      responsible: 'EPO',
      department_code: 'EPO',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Environmental impact, open space, tree preservation'
    },
    {
      id: 'CIRC-07',
      section: 'CIRCULATION',
      item_number: 7,
      description: 'Roads & Stormwater',
      requirement: 'Circulate for road access and stormwater management comment',
      responsible: 'RSW',
      department_code: 'RSW',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Stormwater management plan, driveway access, road widening requirements'
    },
    {
      id: 'CIRC-08',
      section: 'CIRCULATION',
      item_number: 8,
      description: 'Legal Services',
      requirement: 'Circulate for title deed restriction compliance comment',
      responsible: 'Legal',
      department_code: 'BC',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Servitude checking, deed restrictions, consolidation/subdivision legalities'
    },
    {
      id: 'CIRC-09',
      section: 'CIRCULATION',
      item_number: 9,
      description: 'Municipal Health',
      requirement: 'Circulate for health and sanitation comment',
      responsible: 'MH',
      department_code: 'MH',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Ventilation, lighting, waste, food premises requirements'
    },
    {
      id: 'CIRC-10',
      section: 'CIRCULATION',
      item_number: 10,
      description: 'Geology',
      requirement: 'Circulate for geotechnical comment where applicable',
      responsible: 'GEO',
      department_code: 'GEO',
      ai_auto_checkable: false,
      measured_field: null,
      required_value: null,
      guidance: 'Required for hillside sites, unstable soil, or special foundation conditions'
    },
  ],

  /**
   * Get all items for a specific section
   */
  getBySection(sectionId) {
    return this.items.filter(item => item.section === sectionId);
  },

  /**
   * Get all items for a specific application type
   * residential: all items apply
   * commercial/industrial: more departments apply
   */
  getForApplicationType(appType) {
    if (appType === 'residential') {
      return this.items.filter(item => !['CIRCULATION'].includes(item.section));
    }
    return this.items;
  },

  /**
   * Get AI auto-checkable items only
   */
  getAutoCheckable() {
    return this.items.filter(item => item.ai_auto_checkable && item.section !== 'CIRCULATION');
  },

  /**
   * Get manual-only items (need examiner review of uploaded documents)
   */
  getManualOnly() {
    return this.items.filter(item => !item.ai_auto_checkable && item.section !== 'CIRCULATION');
  },

  /**
   * Get section summary counts
   */
  getSectionSummary() {
    const summary = {};
    for (const section of this.sections) {
      const sectionItems = this.items.filter(i => i.section === section.id);
      summary[section.id] = {
        ...section,
        auto_checkable: sectionItems.filter(i => i.ai_auto_checkable).length,
        manual_only: sectionItems.filter(i => !i.ai_auto_checkable).length,
      };
    }
    return summary;
  },

  /**
   * Map checklist item ID to equivalent SANS clause ID used in application_analysis
   */
  clauseMapping: {
    // Maps Bra Joe checklist IDs → SANS 10400 clause IDs used in existing AI analysis
    'GEN-04': 'SANS10400-H2',   // Coverage
    'GEN-18': 'SANS10400-H2',   // Second dwelling (coverage proxy)
    'GEN-19': 'SANS10400-H2',   // Habitable outbuilding
    'GEN-20': 'SANS10400-H2',   // Total outbuildings
    'FLR-04': 'SANS10400-E1',   // Room sizes
    'FLR-08': 'SANS10400-G1',   // Ventilation/lighting
    'SEC-03': 'SANS10400-A2',   // Ceiling height
    'SEC-06': 'SANS10400-D1',   // Stair dimensions
    'SEC-06': 'SANS10400-D2',   // Stair rise
    'ELV-01': 'SANS10400-H1',   // Building height
    'DRN-04': 'SANS10400-P',    // Drainage invert level
    'DRN-06': 'SANS10400-P',    // Drainage gradient
    'DRN-12': 'SANS10400-Q',    // Septic distance
    'DRN-13': 'SANS10400-Q',    // Septic water distance
  }
};

module.exports = BRA_JOE_CHECKLIST;
