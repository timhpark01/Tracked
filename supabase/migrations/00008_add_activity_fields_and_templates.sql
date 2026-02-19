-- Migration: Add activity fields and templates system
-- This migration introduces flexible field tracking for activities and a template system

-- 1. Create activity_fields table
CREATE TABLE activity_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('time', 'number', 'distance', 'text')),
  unit TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, name)
);

CREATE INDEX idx_activity_fields_activity_id ON activity_fields(activity_id);

ALTER TABLE activity_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fields of own activities" ON activity_fields
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM activities WHERE activities.id = activity_fields.activity_id AND activities.user_id = auth.uid())
  );

CREATE POLICY "Users can view fields of public activities" ON activity_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities
      JOIN profiles ON profiles.id = activities.user_id
      WHERE activities.id = activity_fields.activity_id AND profiles.is_public = true
    )
  );

CREATE POLICY "Users can insert fields for own activities" ON activity_fields
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM activities WHERE activities.id = activity_fields.activity_id AND activities.user_id = auth.uid())
  );

CREATE POLICY "Users can update fields of own activities" ON activity_fields
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM activities WHERE activities.id = activity_fields.activity_id AND activities.user_id = auth.uid())
  );

CREATE POLICY "Users can delete fields of own activities" ON activity_fields
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM activities WHERE activities.id = activity_fields.activity_id AND activities.user_id = auth.uid())
  );

-- 2. Create activity_templates table
CREATE TABLE activity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_templates_user_id ON activity_templates(user_id);
CREATE INDEX idx_activity_templates_is_system ON activity_templates(is_system);

ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system templates" ON activity_templates
  FOR SELECT USING (is_system = true);

CREATE POLICY "Users can view own templates" ON activity_templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own templates" ON activity_templates
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can update own templates" ON activity_templates
  FOR UPDATE USING (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete own templates" ON activity_templates
  FOR DELETE USING (user_id = auth.uid() AND is_system = false);

-- 3. Create template_fields table
CREATE TABLE template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES activity_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('time', 'number', 'distance', 'text')),
  unit TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  UNIQUE(template_id, name)
);

CREATE INDEX idx_template_fields_template_id ON template_fields(template_id);

ALTER TABLE template_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view template fields" ON template_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activity_templates
      WHERE activity_templates.id = template_fields.template_id
      AND (activity_templates.is_system = true OR activity_templates.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert fields for own templates" ON template_fields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_templates
      WHERE activity_templates.id = template_fields.template_id
      AND activity_templates.user_id = auth.uid()
      AND activity_templates.is_system = false
    )
  );

CREATE POLICY "Users can update fields of own templates" ON template_fields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM activity_templates
      WHERE activity_templates.id = template_fields.template_id
      AND activity_templates.user_id = auth.uid()
      AND activity_templates.is_system = false
    )
  );

CREATE POLICY "Users can delete fields of own templates" ON template_fields
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM activity_templates
      WHERE activity_templates.id = template_fields.template_id
      AND activity_templates.user_id = auth.uid()
      AND activity_templates.is_system = false
    )
  );

-- 4. Insert system templates
INSERT INTO activity_templates (name, description, category, is_system) VALUES
  ('Running', 'Track runs with distance and duration', 'Fitness', true),
  ('Reading', 'Track reading sessions with pages and duration', 'Learning', true),
  ('Workout', 'Track exercises with duration, sets, and reps', 'Fitness', true),
  ('Cooking', 'Track cooking sessions with duration and servings', 'Lifestyle', true),
  ('Golf', 'Track golf rounds with holes and score', 'Sports', true);

-- 5. Insert template fields for system templates
-- Running
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Distance', 'distance', 'km', 1, true FROM activity_templates WHERE name = 'Running' AND is_system = true;
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Duration', 'time', 'min', 2, false FROM activity_templates WHERE name = 'Running' AND is_system = true;

-- Reading
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Pages', 'number', 'pages', 1, true FROM activity_templates WHERE name = 'Reading' AND is_system = true;
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Duration', 'time', 'min', 2, false FROM activity_templates WHERE name = 'Reading' AND is_system = true;

-- Workout
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Duration', 'time', 'min', 1, true FROM activity_templates WHERE name = 'Workout' AND is_system = true;
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Sets', 'number', 'sets', 2, false FROM activity_templates WHERE name = 'Workout' AND is_system = true;
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Reps', 'number', 'reps', 3, false FROM activity_templates WHERE name = 'Workout' AND is_system = true;

-- Cooking
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Duration', 'time', 'min', 1, true FROM activity_templates WHERE name = 'Cooking' AND is_system = true;
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Servings', 'number', 'servings', 2, false FROM activity_templates WHERE name = 'Cooking' AND is_system = true;

-- Golf
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Holes', 'number', 'holes', 1, true FROM activity_templates WHERE name = 'Golf' AND is_system = true;
INSERT INTO template_fields (template_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Score', 'number', 'strokes', 2, false FROM activity_templates WHERE name = 'Golf' AND is_system = true;

-- 6. Migrate existing activities to have a "Duration" field
INSERT INTO activity_fields (activity_id, name, field_type, unit, display_order, is_primary)
SELECT id, 'Duration', 'time', 'min', 1, true FROM activities;

-- 7. Migrate existing logs to use metadata for field values
UPDATE activity_logs
SET metadata = jsonb_build_object(
  'fields', jsonb_build_object(
    'Duration', jsonb_build_object('value', value, 'unit', 'min')
  )
)
WHERE metadata = '{}'::jsonb OR metadata IS NULL;
