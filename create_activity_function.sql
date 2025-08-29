-- Create a database function to insert user activities
-- This bypasses any client-side ON CONFLICT issues

CREATE OR REPLACE FUNCTION insert_user_activity(
  p_user_id UUID,
  p_activity_type VARCHAR(50),
  p_activity_name VARCHAR(255),
  p_duration_seconds INTEGER,
  p_score INTEGER,
  p_max_score INTEGER,
  p_accuracy_percentage DECIMAL(5,2)
) RETURNS JSON AS $$
DECLARE
  v_activity_id UUID;
  v_result JSON;
BEGIN
  -- Insert the activity
  INSERT INTO user_activities (
    user_id,
    activity_type,
    activity_name,
    duration_seconds,
    score,
    max_score,
    accuracy_percentage,
    completed_at
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_activity_name,
    p_duration_seconds,
    p_score,
    p_max_score,
    p_accuracy_percentage,
    NOW()
  ) RETURNING id INTO v_activity_id;
  
  -- Return success result
  v_result := json_build_object(
    'success', true,
    'id', v_activity_id,
    'message', 'Activity tracked successfully'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_user_activity TO authenticated;
