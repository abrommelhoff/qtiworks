alter table candidate_responses add response_correctness varchar(10);
alter table candidate_responses add time_on_task varchar(10);
alter table candidate_responses add response_feedback longtext;
alter table candidate_responses add misconception_type longtext;
alter table candidate_responses add misconception_value varchar(16);