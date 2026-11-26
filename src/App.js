import React, { useState, useEffect } from 'react';
import axios from 'axios';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

import { Pie } from 'react-chartjs-2';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

import './index.css';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function App() {
  // =====================================================
  // AUTH STATE
  // =====================================================

  const [isLoginView, setIsLoginView] = useState(true);

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );

  const [token, setToken] = useState(
    localStorage.getItem('token') || ''
  );

  // =====================================================
  // THEME
  // =====================================================

  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') !== 'light'
  );

  // =====================================================
  // BUDGET
  // =====================================================

  const [budgetLimit, setBudgetLimit] = useState(
    localStorage.getItem('budgetLimit') || '20000'
  );

  const [isEditingBudget, setIsEditingBudget] =
    useState(false);

  // =====================================================
  // SEARCH + DATE FILTER
  // =====================================================

  const [searchQuery, setSearchQuery] = useState('');

  const [dateFilter, setDateFilter] =
    useState('all');

  // =====================================================
  // CURRENCY
  // =====================================================

  const [currency, setCurrency] = useState('INR');

  const [exchangeRates] = useState({
    USD: 0.012,
    EUR: 0.011,
    INR: 1,
  });

  // =====================================================
  // FINANCIAL GOALS
  // =====================================================

  const [goals, setGoals] = useState([]);

  const [goalTitle, setGoalTitle] = useState('');

  const [goalTarget, setGoalTarget] = useState('');

  const [savingAmount, setSavingAmount] =
    useState({});

  // =====================================================
  // AUTH FORM
  // =====================================================

  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  // =====================================================
  // TRANSACTIONS
  // =====================================================

  const [transactions, setTransactions] =
    useState([]);

  const [text, setText] = useState('');

  const [amount, setAmount] = useState('');

  const [type, setType] = useState('income');

  const [category, setCategory] =
    useState('Salary');

  const [isRecurring, setIsRecurring] =
    useState(false);

  // =====================================================
  // API URLS
  // =====================================================

  const AUTH_URL =
    'http://localhost:5000/api/auth';

  const API_URL =
    'http://localhost:5000/api/transactions';

  const GOAL_URL =
    'http://localhost:5000/api/goals';

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =====================================================
  // CATEGORY LISTS
  // =====================================================

  const incomeCategories = [
    'Salary',
    'Freelance',
    'Investment',
  ];

  const expenseCategories = [
    'Food',
    'Rent',
    'Shopping',
    'Entertainment',
    'Bills',
    'Goals',
    'Others',
  ];

  // =====================================================
  // THEME EFFECT
  // =====================================================

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove(
        'light-mode'
      );

      localStorage.setItem(
        'theme',
        'dark'
      );
    } else {
      document.body.classList.add(
        'light-mode'
      );

      localStorage.setItem(
        'theme',
        'light'
      );
    }
  }, [isDarkMode]);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (token) {
      getTransactions();
      getGoals();
    }

    // eslint-disable-next-line
  }, [token]);

  // =====================================================
  // GET TRANSACTIONS
  // =====================================================

  const getTransactions = async () => {
    try {
      const res = await axios.get(
        API_URL,
        config
      );

      setTransactions(
        res.data.data || []
      );
    } catch (err) {
      console.error(
        'Transactions load error:',
        err
      );
    }
  };

  // =====================================================
  // GET GOALS
  // =====================================================

  const getGoals = async () => {
    try {
      const res = await axios.get(
        GOAL_URL,
        config
      );

      setGoals(
        res.data.data || []
      );
    } catch (err) {
      console.error(
        'Goals load error:',
        err
      );
    }
  };

  // =====================================================
  // LOGIN / SIGNUP
  // =====================================================

  const handleAuth = async (e) => {
    e.preventDefault();

    const endpoint = isLoginView
      ? `${AUTH_URL}/login`
      : `${AUTH_URL}/signup`;

    const body = isLoginView
      ? {
          email,
          password,
        }
      : {
          name,
          email,
          password,
        };

    try {
      const res = await axios.post(
        endpoint,
        body
      );

      localStorage.setItem(
        'token',
        res.data.token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(
          res.data.user
        )
      );

      setToken(res.data.token);

      setUser(res.data.user);

      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      alert(
        err.response?.data?.msg ||
          'Authentication error!'
      );
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem('token');

    localStorage.removeItem('user');

    setToken('');

    setUser(null);

    setTransactions([]);

    setGoals([]);
  };

  // =====================================================
  // ADD TRANSACTION
  // =====================================================

  const onSubmitTransaction = async (e) => {
    e.preventDefault();

    const numericAmount =
      parseFloat(amount);

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      alert(
        'कृपया सही राशि दर्ज करें।'
      );

      return;
    }

    const transactionAmount =
      type === 'expense'
        ? -Math.abs(numericAmount)
        : Math.abs(numericAmount);

    const label = isRecurring
      ? `[🔄 Recurring][${category}]`
      : `[${category}]`;

    try {
      const res = await axios.post(
        API_URL,
        {
          text: `${label} ${text}`,
          amount: transactionAmount,
          type,
        },
        config
      );

      setTransactions((prev) => [
        res.data.data,
        ...prev,
      ]);

      setText('');

      setAmount('');

      setIsRecurring(false);
    } catch (err) {
      console.error(
        'Transaction error:',
        err
      );
    }
  };

  // =====================================================
  // DELETE TRANSACTION
  // =====================================================

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(
        `${API_URL}/${id}`,
        config
      );

      setTransactions((prev) =>
        prev.filter(
          (t) => t._id !== id
        )
      );
    } catch (err) {
      console.error(
        'Delete error:',
        err
      );
    }
  };

  // =====================================================
  // CREATE GOAL
  // =====================================================

  const onCreateGoal = async (e) => {
    e.preventDefault();

    const target =
      parseFloat(goalTarget);

    if (!target || target <= 0) {
      alert(
        'कृपया सही target amount डालें।'
      );

      return;
    }

    try {
      const res = await axios.post(
        GOAL_URL,
        {
          title: goalTitle,
          targetAmount: target,
        },
        config
      );

      setGoals((prev) => [
        ...prev,
        res.data.data,
      ]);

      setGoalTitle('');

      setGoalTarget('');
    } catch (err) {
      console.error(
        'Goal creation error:',
        err
      );
    }
  };

  // =====================================================
  // SAVE MONEY TO GOAL
  // =====================================================

  const onSaveToGoal = async (
    goalId
  ) => {
    const amt = parseFloat(
      savingAmount[goalId] || 0
    );

    if (!amt || amt <= 0) {
      alert(
        'कृपया सही राशि डालें।'
      );

      return;
    }

    try {
      const res = await axios.put(
        `${GOAL_URL}/${goalId}`,
        {
          amount: amt,
        },
        config
      );

      setGoals((prev) =>
        prev.map((g) =>
          g._id === goalId
            ? res.data.data
            : g
        )
      );

      // Goal saving को expense के रूप में record करें
      await axios.post(
        API_URL,
        {
          text: `[Goals] Saved for ${res.data.data.title}`,
          amount: -amt,
          type: 'expense',
        },
        config
      );

      getTransactions();

      setSavingAmount((prev) => ({
        ...prev,
        [goalId]: '',
      }));
    } catch (err) {
      console.error(
        'Goal saving error:',
        err
      );
    }
  };

  // =====================================================
  // SAVE BUDGET
  // =====================================================

  const saveBudget = (e) => {
    e.preventDefault();

    const budget =
      parseFloat(budgetLimit);

    if (!budget || budget <= 0) {
      alert(
        'कृपया सही budget amount डालें।'
      );

      return;
    }

    localStorage.setItem(
      'budgetLimit',
      budgetLimit
    );

    setIsEditingBudget(false);
  };

  // =====================================================
  // CURRENCY FORMATTER
  // =====================================================

  const formatCurrency = (
    amtInINR
  ) => {
    const rate =
      exchangeRates[currency] || 1;

    const converted =
      parseFloat(amtInINR || 0) *
      rate;

    if (currency === 'USD') {
      return `$${converted.toFixed(2)}`;
    }

    if (currency === 'EUR') {
      return `€${converted.toFixed(2)}`;
    }

    return `₹${converted.toFixed(2)}`;
  };

  // =====================================================
  // FILTER TRANSACTIONS
  // =====================================================

  const filteredTransactions =
    transactions.filter((t) => {
      const matchesSearch =
        t.text
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          );

      if (!matchesSearch) {
        return false;
      }

      if (dateFilter === 'all') {
        return true;
      }

      const txDate = new Date(
        t.createdAt
      );

      const today = new Date();

      const diffTime =
        today - txDate;

      const diffDays =
        diffTime /
        (1000 * 60 * 60 * 24);

      if (dateFilter === '7days') {
        return diffDays <= 7;
      }

      if (dateFilter === '30days') {
        return diffDays <= 30;
      }

      return true;
    });

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const amounts =
    filteredTransactions.map(
      (t) => Number(t.amount)
    );

  const total =
    amounts
      .reduce(
        (acc, item) =>
          acc + item,
        0
      )
      .toFixed(2);

  const income =
    amounts
      .filter(
        (item) => item > 0
      )
      .reduce(
        (acc, item) =>
          acc + item,
        0
      )
      .toFixed(2);

  const expense =
    (
      amounts
        .filter(
          (item) => item < 0
        )
        .reduce(
          (acc, item) =>
            acc + item,
          0
        ) * -1
    ).toFixed(2);

  // =====================================================
  // CHART
  // =====================================================

  const categoryTotals =
    expenseCategories.map(
      (cat) => {
        return filteredTransactions
          .filter(
            (t) =>
              Number(t.amount) < 0 &&
              t.text.includes(
                `[${cat}]`
              )
          )
          .reduce(
            (sum, t) =>
              sum +
              Math.abs(
                Number(t.amount)
              ),
            0
          );
      }
    );

  const chartData = {
    labels: expenseCategories,

    datasets: [
      {
        data: categoryTotals,

        backgroundColor: [
          '#ff6384',
          '#36a2eb',
          '#ffce56',
          '#4bc0c0',
          '#9966ff',
          '#4caf50',
          '#ff9f40',
        ],

        borderWidth: 0,
      },
    ],
  };

  // =====================================================
  // BUDGET PERCENTAGE
  // =====================================================

  const numericBudget =
    parseFloat(budgetLimit) || 0;

  const numericExpense =
    parseFloat(expense) || 0;

  const budgetUsagePercent =
    numericBudget > 0
      ? (
          (numericExpense /
            numericBudget) *
          100
        ).toFixed(1)
      : '0.0';

  // =====================================================
  // PDF REPORT
  // =====================================================

  const downloadPDFReport = () => {
    const doc = new jsPDF();

    doc.text(
      `FinTrack Pro - Expense Report (${user?.name || 'User'})`,
      14,
      15
    );

    const tableRows = [];

    filteredTransactions.forEach(
      (t) => {
        const matchData =
          t.text.match(
            /\[(.*?)\]/
          );

        const displayCategory =
          matchData
            ? matchData[1]
            : 'Others';

        const cleanText =
          t.text.replace(
            /\[.*?\]\s*/g,
            ''
          );

        const sign =
          t.amount < 0
            ? '-'
            : '+';

        tableRows.push([
          new Date(
            t.createdAt
          ).toLocaleDateString(),

          displayCategory,

          cleanText,

          `${sign}Rs. ${Math.abs(
            t.amount
          ).toFixed(2)}`,
        ]);
      }
    );

    doc.autoTable({
      head: [
        [
          'Date',
          'Category',
          'Description',
          'Amount',
        ],
      ],

      body: tableRows,

      startY: 25,
    });

    doc.save(
      `Expense_Report_${user?.name || 'User'}.pdf`
    );
  };

  // =====================================================
  // LOGIN SCREEN
  // =====================================================

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">

          <h2>
            {isLoginView
              ? 'Welcome Back'
              : 'Create Account'}
          </h2>

          <form
            onSubmit={handleAuth}
          >

            {!isLoginView && (
              <div className="form-group">
                <input
                  type="text"
                  placeholder="आपका नाम"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  required
                />
              </div>
            )}

            <div className="form-group">
              <input
                type="email"
                placeholder="ईमेल"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="पासवर्ड"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
            >
              {isLoginView
                ? 'लॉगिन'
                : 'रजिस्टर'}
            </button>

          </form>

          <p className="switch-text">
            {isLoginView
              ? 'नया अकाउंट चाहिए? '
              : 'पहले से अकाउंट है? '}

            <span
              onClick={() =>
                setIsLoginView(
                  !isLoginView
                )
              }
            >
              {isLoginView
                ? 'यहाँ साइनअप करें'
                : 'यहाँ लॉगिन करें'}
            </span>
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="app-layout">

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">

        <div className="nav-brand">
          ✨ FinTrack{' '}
          <span>Pro</span>
        </div>

        <div className="user-profile">

          {/* Currency */}

          <select
            value={currency}
            onChange={(e) =>
              setCurrency(
                e.target.value
              )
            }
            style={{
              width: '100px',
              padding: '5px',
              marginRight: '10px',
            }}
          >
            <option value="INR">
              🇮🇳 INR
            </option>

            <option value="USD">
              🇺🇸 USD
            </option>

            <option value="EUR">
              🇪🇺 EUR
            </option>
          </select>

          {/* Theme */}

          <button
            className="theme-toggle"
            onClick={() =>
              setIsDarkMode(
                !isDarkMode
              )
            }
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.3rem',
              cursor: 'pointer',
            }}
          >
            {isDarkMode
              ? '☀️'
              : '🌙'}
          </button>

          <span>
            {user.name}
          </span>

          <button
            className="btn-logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>

      {/* ================= FILTERS ================= */}

      <div
        className="filters-row"
        style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >

        <input
          type="text"
          placeholder="🔍 इतिहास में से विवरण सर्च करें..."
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(
              e.target.value
            )
          }
          style={{
            flex: '2',
            minWidth: '200px',
          }}
        />

        <select
          value={dateFilter}
          onChange={(e) =>
            setDateFilter(
              e.target.value
            )
          }
          style={{
            flex: '1',
            minWidth: '150px',
          }}
        >
          <option value="all">
            📅 पूरा समय
          </option>

          <option value="7days">
            ⏳ पिछले 7 दिन
          </option>

          <option value="30days">
            🗓️ पिछले 30 दिन
          </option>
        </select>

      </div>

      {/* ================= METRICS ================= */}

      <div className="metrics-section">

        <div className="premium-card balance">
          <h4>
            कुल बैलेंस
          </h4>

          <h2>
            {formatCurrency(
              total
            )}
          </h2>
        </div>

        <div className="premium-card income">
          <h4>
            कुल आय
          </h4>

          <h2>
            +
            {formatCurrency(
              income
            )}
          </h2>
        </div>

        <div className="premium-card expense">
          <h4>
            कुल खर्च
          </h4>

          <h2>
            -
            {formatCurrency(
              expense
            )}
          </h2>
        </div>

      </div>

      {/* ================= BUDGET ================= */}

      <div
        className="glass-card budget-widget"
        style={{
          marginTop: '20px',
          borderLeft:
            numericExpense >
            numericBudget
              ? '5px solid var(--danger)'
              : '5px solid var(--success)',
        }}
      >

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px',
          }}
        >

          <div>

            <h3>
              🎯 मासिक बजट सीमा:{' '}

              {isEditingBudget ? (
                <form
                  onSubmit={
                    saveBudget
                  }
                  style={{
                    display: 'inline',
                  }}
                >

                  <input
                    type="number"
                    min="1"
                    value={
                      budgetLimit
                    }
                    onChange={(e) =>
                      setBudgetLimit(
                        e.target.value
                      )
                    }
                    style={{
                      width: '120px',
                      padding: '5px',
                      margin:
                        '0 10px',
                    }}
                  />

                  <button
                    type="submit"
                    className="btn-save-budget"
                    style={{
                      width: 'auto',
                      padding:
                        '5px 10px',
                    }}
                  >
                    Save
                  </button>

                </form>
              ) : (
                <>
                  {formatCurrency(
                    budgetLimit
                  )}

                  <button
                    onClick={() =>
                      setIsEditingBudget(
                        true
                      )
                    }
                    style={{
                      background:
                        'none',
                      border: 'none',
                      cursor:
                        'pointer',
                    }}
                  >
                    ✏️
                  </button>
                </>
              )}
            </h3>

            <p>
              बजट का उपयोग:{' '}
              <b>
                {budgetUsagePercent}%
              </b>
            </p>

          </div>

          {numericExpense >
            numericBudget && (
            <div className="alert-badge">
              ⚠️ अलर्ट: बजट सीमा समाप्त!
            </div>
          )}

        </div>

      </div>

      {/* ================= GOALS ================= */}

      <div
        className="glass-card goals-section"
        style={{
          marginTop: '20px',
        }}
      >

        <h3>
          🎯 आपके वित्तीय लक्ष्य
        </h3>

        <div
          className="goals-grid"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginTop: '15px',
          }}
        >

          {/* CREATE GOAL */}

          <form
            onSubmit={
              onCreateGoal
            }
            className="premium-form"
            style={{
              background:
                'rgba(255,255,255,0.02)',
              padding: '15px',
              borderRadius: '10px',
            }}
          >

            <h4>
              नया लक्ष्य सेट करें
            </h4>

            <input
              type="text"
              placeholder="उदा. नया आईफोन, कार लोन..."
              value={goalTitle}
              onChange={(e) =>
                setGoalTitle(
                  e.target.value
                )
              }
              required
              style={{
                marginBottom:
                  '10px',
                width: '100%',
              }}
            />

            <input
              type="number"
              placeholder="टार्गेट राशि (₹)"
              value={goalTarget}
              onChange={(e) =>
                setGoalTarget(
                  e.target.value
                )
              }
              required
              min="1"
              style={{
                marginBottom:
                  '10px',
                width: '100%',
              }}
            />

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '8px',
              }}
            >
              लक्ष्य बनाएं
            </button>

          </form>

          {/* GOALS LIST */}

          {goals.map((g) => {

            const current =
              Number(
                g.currentAmount || 0
              );

            const target =
              Number(
                g.targetAmount || 0
              );

            const percent =
              target > 0
                ? Math.min(
                    (current /
                      target) *
                      100,
                    100
                  ).toFixed(0)
                : 0;

            return (
              <div
                key={g._id}
                className="goal-item-card"
                style={{
                  background:
                    'rgba(255,255,255,0.03)',
                  padding: '15px',
                  borderRadius:
                    '10px',
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    fontWeight:
                      'bold',
                  }}
                >
                  <span>
                    {g.title}
                  </span>

                  <span>
                    {percent}%
                  </span>
                </div>

                {/* Progress Bar */}

                <div
                  className="progress-bg"
                  style={{
                    background:
                      '#334155',
                    height: '10px',
                    borderRadius:
                      '5px',
                    margin:
                      '10px 0',
                    overflow:
                      'hidden',
                  }}
                >

                  <div
                    className="progress-fill"
                    style={{
                      background:
                        'var(--success)',
                      height: '100%',
                      width: `${percent}%`,
                    }}
                  />

                </div>

                <p
                  style={{
                    fontSize:
                      '0.85rem',
                    color:
                      'var(--text-muted)',
                  }}
                >
                  {formatCurrency(
                    current
                  )}{' '}
                  /{' '}
                  {formatCurrency(
                    target
                  )}{' '}
                  बचाया
                </p>

                {/* Save To Goal */}

                <div
                  style={{
                    display: 'flex',
                    gap: '5px',
                    marginTop:
                      '10px',
                  }}
                >

                  <input
                    type="number"
                    min="1"
                    placeholder="पैसे जमा करें"
                    value={
                      savingAmount[
                        g._id
                      ] || ''
                    }
                    onChange={(e) =>
                      setSavingAmount(
                        (prev) => ({
                          ...prev,
                          [g._id]:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={{
                      padding:
                        '5px',
                      flex: '1',
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      onSaveToGoal(
                        g._id
                      )
                    }
                    style={{
                      background:
                        'var(--success)',
                      border: 'none',
                      color: '#fff',
                      padding:
                        '5px 10px',
                      borderRadius:
                        '4px',
                      cursor:
                        'pointer',
                    }}
                  >
                    Save
                  </button>

                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* ================= MAIN CONTENT ================= */}

      <div
        className="content-section"
        style={{
          marginTop: '20px',
        }}
      >

        {/* ================= CHART ================= */}

        <div className="glass-card chart-box">

          <h3>
            खर्चों का विश्लेषण
          </h3>

          <div className="pie-container">

            {amounts.filter(
              (x) => x < 0
            ).length > 0 ? (
              <Pie
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position:
                        'bottom',
                    },
                  },
                }}
              />
            ) : (
              <p>
                कोई खर्च डेटा
                उपलब्ध नहीं है।
              </p>
            )}

          </div>

        </div>

        {/* ================= TRANSACTION FORM ================= */}

        <div className="glass-card">

          <h3>
            ➕ नया ट्रांजैक्शन
          </h3>

          <form
            onSubmit={
              onSubmitTransaction
            }
          >

            {/* TYPE */}

            <div className="form-group">

              <label>
                प्रकार
              </label>

              <select
                value={type}
                onChange={(e) => {

                  const newType =
                    e.target.value;

                  setType(newType);

                  setCategory(
                    newType ===
                      'income'
                      ? 'Salary'
                      : 'Food'
                  );
                }}
              >

                <option value="income">
                  💰 आय (Income)
                </option>

                <option value="expense">
                  💸 खर्च (Expense)
                </option>

              </select>

            </div>

            {/* CATEGORY */}

            <div className="form-group">

              <label>
                कैटेगरी
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
              >

                {(type === 'income'
                  ? incomeCategories
                  : expenseCategories
                ).map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                  >
                    {cat}
                  </option>
                ))}

              </select>

            </div>

            {/* DESCRIPTION */}

            <div className="form-group">

              <label>
                विवरण
              </label>

              <input
                type="text"
                placeholder="विवरण लिखें..."
                value={text}
                onChange={(e) =>
                  setText(
                    e.target.value
                  )
                }
                required
              />

            </div>

            {/* AMOUNT */}

            <div className="form-group">

              <label>
                राशि
              </label>

              <input
                type="number"
                placeholder="राशि (₹)"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                required
                min="1"
                step="0.01"
              />

            </div>

            {/* RECURRING */}

            <div
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: '8px',
                marginBottom:
                  '15px',
              }}
            >

              <input
                type="checkbox"
                checked={
                  isRecurring
                }
                onChange={(e) =>
                  setIsRecurring(
                    e.target.checked
                  )
                }
                style={{
                  width: 'auto',
                }}
              />

              <label>
                🔄 Recurring Transaction
              </label>

            </div>

            <button
              type="submit"
              className="btn-primary"
            >
              {type === 'income'
                ? '💰 आय जोड़ें'
                : '💸 खर्च जोड़ें'}
            </button>

          </form>

        </div>

      </div>

      {/* ================= RECENT TRANSACTIONS ================= */}

      <div
        className="glass-card transactions-box"
        style={{
          marginTop: '20px',
        }}
      >

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            marginBottom:
              '15px',
            alignItems:
              'center',
            flexWrap:
              'wrap',
            gap: '10px',
          }}
        >

          <h3>
            हालिया लेन-देन
          </h3>

          <button
            onClick={
              downloadPDFReport
            }
            className="btn-download"
            style={{
              width: 'auto',
              padding:
                '8px 15px',
              background:
                'var(--primary)',
              border: 'none',
              color: '#fff',
              borderRadius:
                '6px',
              cursor:
                'pointer',
            }}
          >
            📥 Report PDF
          </button>

        </div>

        {filteredTransactions.length ===
        0 ? (
          <p className="empty-state">
            {searchQuery
              ? 'सर्च से कोई transaction नहीं मिला।'
              : 'अभी कोई transaction नहीं है।'}
          </p>
        ) : (
          <ul
            className="transaction-list"
          >

            {filteredTransactions.map(
              (t) => {

                const matchData =
                  t.text.match(
                    /\[(.*?)\]/
                  );

                const displayCategory =
                  matchData
                    ? matchData[1]
                    : 'Others';

                const cleanText =
                  t.text.replace(
                    /\[.*?\]\s*/g,
                    ''
                  );

                const isExpense =
                  Number(
                    t.amount
                  ) < 0;

                return (
                  <li
                    key={t._id}
                    className={
                      isExpense
                        ? 'border-expense'
                        : 'border-income'
                    }
                  >

                    <div className="transaction-info">

                      <strong>
                        {displayCategory}
                      </strong>

                      <span>
                        {cleanText}
                      </span>

                      <small>
                        {t.createdAt
                          ? new Date(
                              t.createdAt
                            ).toLocaleDateString()
                          : ''}
                      </small>

                    </div>

                    <div className="transaction-actions">

                      <span
                        className={`tx-amount ${
                          isExpense
                            ? 'minus-text'
                            : 'plus-text'
                        }`}
                      >
                        {isExpense
                          ? '-'
                          : '+'}

                        {formatCurrency(
                          Math.abs(
                            Number(
                              t.amount
                            )
                          )
                        )}
                      </span>

                      <button
                        className="btn-del"
                        onClick={() =>
                          deleteTransaction(
                            t._id
                          )
                        }
                        title="Delete"
                      >
                        🗑️
                      </button>

                    </div>

                  </li>
                );
              }
            )}

          </ul>
        )}

      </div>

    </div>
  );
}

export default App;
