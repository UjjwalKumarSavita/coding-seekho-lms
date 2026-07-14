import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api, jsonBody } from '../api';
import { Empty, formatDate } from '../components/AppLayout';

const blankQuestion = () => ({ prompt: '', options: ['', '', '', ''], correctOption: 0, points: 1 });

export default function Quizzes() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState(params.get('batch') || '');
  const [quizzes, setQuizzes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [taking, setTaking] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [error, setError] = useState('');
  const canTeach = user.role !== 'STUDENT';

  useEffect(() => {
    api('/batches').then(data => {
      setBatches(data);
      if (!batchId && data.length) setBatchId(String(data[0].id));
    }).catch(err => setError(err.message));
  }, [batchId]);

  const refresh = useCallback(() => {
    if (!batchId) return;
    setParams({ batch: batchId }, { replace: true });
    api(`/quizzes/batch/${batchId}`).then(setQuizzes).catch(err => setError(err.message));
  }, [batchId, setParams]);

  useEffect(() => { refresh(); }, [refresh]);

  async function openQuiz(quiz) {
    const detail = await api(`/quizzes/${quiz.id}`);
    if (canTeach) setReviewing({ quiz: detail, attempts: null });
    else setTaking(detail);
  }

  async function loadAttempts(quiz) {
    const attempts = await api(`/quizzes/${quiz.id}/attempts`);
    setReviewing({ quiz, attempts });
  }

  return (
    <>
      <section className="page-hero quiz-hero reveal">
        <div>
          <p className="eyebrow">PRACTICE LAB</p>
          <h1>Test small concepts.<br /><span>Build lasting confidence.</span></h1>
          <p>Focused MCQ practice with instant scoring, clear progress, and room to try again.</p>
        </div>
        <div className="quiz-hero-score" aria-hidden="true"><strong>10</strong><span>/10</span><i></i></div>
      </section>

      <section className="learning-toolbar reveal reveal-delay-1">
        <label><span>Learning batch</span>
          <select value={batchId} onChange={event => setBatchId(event.target.value)}>
            {batches.map(batch => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </select>
        </label>
        <div>
          <span>{quizzes.length} quiz{quizzes.length === 1 ? '' : 'zes'}</span>
          {canTeach && <button className="primary-button" onClick={() => setShowCreate(true)}>Create quiz</button>}
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}
      {quizzes.length === 0 ? <section className="panel"><Empty text="No quizzes are ready in this batch yet." /></section> : (
        <div className="quiz-grid">
          {quizzes.map((quiz, index) => (
            <article className="quiz-card reveal" style={{ '--delay': `${index * 70}ms` }} key={quiz.id}>
              <div className="quiz-card-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="quiz-card-top">
                <span className={`status-pill ${quiz.published ? 'completed' : 'cancelled'}`}>{quiz.published ? 'READY' : 'DRAFT'}</span>
                <small>{quiz.durationMinutes} min</small>
              </div>
              <h2>{quiz.title}</h2>
              <p>{quiz.description || 'A focused LLC World practice set.'}</p>
              <div className="quiz-meta">
                <span><b>{quiz.questionCount}</b> questions</span>
                <span><b>{quiz.totalPoints}</b> points</span>
              </div>
              {quiz.latestAttempt && <div className="attempt-banner">
                Latest score <strong>{quiz.latestAttempt.percentage}%</strong>
              </div>}
              <button className="primary-button full" onClick={() => openQuiz(quiz)}>
                {canTeach ? 'Open quiz' : quiz.latestAttempt ? 'Try again' : 'Start quiz'}
              </button>
            </article>
          ))}
        </div>
      )}

      {showCreate && <QuizBuilder batchId={Number(batchId)} close={() => setShowCreate(false)} saved={() => {
        setShowCreate(false); refresh();
      }} />}
      {taking && <QuizPlayer quiz={taking} close={() => { setTaking(null); refresh(); }} />}
      {reviewing && <QuizReview state={reviewing} loadAttempts={loadAttempts} close={() => setReviewing(null)} />}
    </>
  );
}

function QuizBuilder({ batchId, close, saved }) {
  const [form, setForm] = useState({
    title: '', description: '', durationMinutes: 15, published: true, questions: [blankQuestion()]
  });
  const [error, setError] = useState('');

  function updateQuestion(index, key, value) {
    setForm(current => ({
      ...current,
      questions: current.questions.map((question, position) =>
        position === index ? { ...question, [key]: value } : question)
    }));
  }

  function updateOption(questionIndex, optionIndex, value) {
    const options = [...form.questions[questionIndex].options];
    options[optionIndex] = value;
    updateQuestion(questionIndex, 'options', options);
  }

  async function submit(event) {
    event.preventDefault();
    try {
      await api('/quizzes', {
        method: 'POST',
        body: jsonBody({
          ...form, batchId, durationMinutes: Number(form.durationMinutes),
          questions: form.questions.map(question => ({ ...question, points: Number(question.points),
            correctOption: Number(question.correctOption) }))
        })
      });
      saved();
    } catch (err) { setError(err.message); }
  }

  return <div className="modal-backdrop"><div className="modal-card quiz-builder">
    <div className="drawer-title"><div><p className="eyebrow">QUIZ STUDIO</p><h2>Create a practice set</h2></div>
      <button onClick={close}>Close</button></div>
    {error && <div className="alert error">{error}</div>}
    <form onSubmit={submit}>
      <div className="product-form">
        <label><span>Quiz title</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
        <label><span>Duration in minutes</span><input type="number" min="1" max="180" value={form.durationMinutes}
          onChange={e => setForm({ ...form, durationMinutes: e.target.value })} required /></label>
        <label className="wide"><span>Student instructions</span><textarea value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <label className="checkbox-field"><input type="checkbox" checked={form.published}
          onChange={e => setForm({ ...form, published: e.target.checked })} /> Publish immediately</label>
      </div>
      <div className="question-builder-list">
        {form.questions.map((question, index) => <section className="question-builder" key={index}>
          <div className="question-number"><span>QUESTION</span><strong>{String(index + 1).padStart(2, '0')}</strong></div>
          <div>
            <label><span>Question</span><textarea value={question.prompt}
              onChange={e => updateQuestion(index, 'prompt', e.target.value)} required /></label>
            <div className="option-builder">
              {question.options.map((option, optionIndex) => <label key={optionIndex}>
                <input type="radio" name={`correct-${index}`} checked={question.correctOption === optionIndex}
                  onChange={() => updateQuestion(index, 'correctOption', optionIndex)} />
                <input value={option} onChange={e => updateOption(index, optionIndex, e.target.value)}
                  placeholder={`Option ${optionIndex + 1}`} required />
              </label>)}
            </div>
            <label className="points-field"><span>Points</span><input type="number" min="1" max="100"
              value={question.points} onChange={e => updateQuestion(index, 'points', e.target.value)} /></label>
          </div>
        </section>)}
      </div>
      <div className="builder-actions">
        <button type="button" className="secondary-button" onClick={() => setForm(current => ({
          ...current, questions: [...current.questions, blankQuestion()]
        }))}>Add question</button>
        <button className="primary-button">Publish quiz</button>
      </div>
    </form>
  </div></div>;
}

function QuizPlayer({ quiz, close }) {
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(quiz.durationMinutes * 60);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (result || seconds <= 0) return undefined;
    const timer = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [result, seconds]);

  async function submitAttempt() {
    try {
      const attempt = await api(`/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        body: jsonBody({ answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId: Number(questionId), selectedOption
        })) })
      });
      setResult(attempt);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => {
    if (seconds === 0 && !result) submitAttempt();
    // The attempt is intentionally submitted only when the countdown reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, result]);

  if (result) return <div className="modal-backdrop"><div className="modal-card result-card">
    <div className="result-orbit"><strong>{result.percentage}%</strong><span>YOUR SCORE</span></div>
    <p className="eyebrow">ATTEMPT COMPLETE</p><h2>{result.percentage >= 70 ? 'Concepts are landing.' : 'One more focused pass.'}</h2>
    <p>You scored {result.score} out of {result.maxScore}. Review the answers, then return whenever you want another attempt.</p>
    <div className="answer-review">
      {quiz.questions.map((question, index) => {
        const review = result.answers.find(answer => answer.questionId === question.id);
        return <div className={review?.correct ? 'correct' : 'incorrect'} key={question.id}>
          <span>{index + 1}</span><p>{question.prompt}</p>
          <b>{review?.correct ? 'Correct' : `Answer: ${question.options[review?.correctOption]}`}</b>
        </div>;
      })}
    </div>
    <button className="primary-button full" onClick={close}>Back to quizzes</button>
  </div></div>;

  const question = quiz.questions[current];
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return <div className="modal-backdrop"><div className="modal-card quiz-player">
    <div className="quiz-player-head"><div><p className="eyebrow">LIVE ATTEMPT</p><h2>{quiz.title}</h2></div>
      <div className={seconds < 60 ? 'quiz-timer urgent' : 'quiz-timer'}>{minutes}:{remainingSeconds}</div></div>
    {error && <div className="alert error">{error}</div>}
    <div className="quiz-progress"><span style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }}></span></div>
    <div className="question-stage">
      <small>Question {current + 1} of {quiz.questions.length} · {question.points} point{question.points === 1 ? '' : 's'}</small>
      <h3>{question.prompt}</h3>
      <div className="answer-options">
        {question.options.map((option, index) => <button className={answers[question.id] === index ? 'selected' : ''}
          onClick={() => setAnswers(value => ({ ...value, [question.id]: index }))} key={index}>
          <span>{String.fromCharCode(65 + index)}</span>{option}
        </button>)}
      </div>
    </div>
    <div className="quiz-navigation">
      <button className="secondary-button" disabled={current === 0} onClick={() => setCurrent(value => value - 1)}>Previous</button>
      <div>{Object.keys(answers).length}/{quiz.questions.length} answered</div>
      {current < quiz.questions.length - 1
        ? <button className="primary-button" onClick={() => setCurrent(value => value + 1)}>Next question</button>
        : <button className="primary-button" onClick={submitAttempt}>Submit attempt</button>}
    </div>
  </div></div>;
}

function QuizReview({ state, loadAttempts, close }) {
  const { quiz, attempts } = state;
  return <div className="modal-backdrop"><div className="modal-card wide-modal">
    <div className="drawer-title"><div><p className="eyebrow">TEACHER REVIEW</p><h2>{quiz.title}</h2></div>
      <button onClick={close}>Close</button></div>
    <div className="quiz-review-summary">
      <div><strong>{quiz.questionCount}</strong><span>Questions</span></div>
      <div><strong>{quiz.totalPoints}</strong><span>Points</span></div>
      <div><strong>{quiz.durationMinutes}</strong><span>Minutes</span></div>
    </div>
    <div className="question-preview">{quiz.questions.map((question, index) => <article key={question.id}>
      <b>{String(index + 1).padStart(2, '0')}</b><div><strong>{question.prompt}</strong>
        <span>Correct: {question.options[question.correctOption]}</span></div></article>)}</div>
    {!attempts ? <button className="primary-button full" onClick={() => loadAttempts(quiz)}>View student attempts</button>
      : attempts.length === 0 ? <Empty text="No attempts have been submitted yet." />
        : <div className="attempt-table">{attempts.map(attempt => <div key={attempt.id}>
          <strong>{attempt.student.username}</strong><span>{attempt.score}/{attempt.maxScore}</span>
          <b>{attempt.percentage}%</b><small>{formatDate(attempt.submittedAt)}</small>
        </div>)}</div>}
  </div></div>;
}
