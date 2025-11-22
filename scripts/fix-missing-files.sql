-- 파일이 실제로 존재하지 않는 이력서 확인
-- R2에 파일이 없는데 DB에 fileUrl이 기록된 경우

-- 1. 문제가 있는 이력서 조회
SELECT 
  resume_id,
  title,
  file_url,
  created_at
FROM resumes
WHERE file_url LIKE '%-.pdf'
ORDER BY created_at DESC;

-- 2. (선택사항) 파일 URL을 NULL로 업데이트
-- UPDATE resumes
-- SET file_url = NULL
-- WHERE file_url = 'resumes/user_35KqG67gFrk3NDW3wvTNm6pq8LD/1763198979676-.pdf';

-- 3. (선택사항) 해당 이력서 삭제
-- UPDATE resumes
-- SET is_active = 0
-- WHERE resume_id = '49f47255-b073-4f3e-8bb1-5f29ec68a85a';

