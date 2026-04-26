import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../App';

const HelpFAQ = () => {
  const { user, theme } = useContext(UserContext);
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set(['general-0']));
  const [activeSection, setActiveSection] = useState(null);
  const [expandedSolution, setExpandedSolution] = useState(null);
  const [likedItems, setLikedItems] = useState(new Set());
  const [dislikedItems, setDislikedItems] = useState(new Set());

  const isLoggedIn = user && user.user_id;
  const isDarkMode = theme === 'dark';

  // Theme classes
  const bgClass = isDarkMode ? 'bg-dark' : 'bg-light';
  const textClass = isDarkMode ? 'text-light' : 'text-dark';
  const cardBgClass = isDarkMode ? 'bg-secondary text-light' : 'bg-white text-dark';
  const borderClass = isDarkMode ? 'border-secondary' : 'border-light';
  const headerBgClass = isDarkMode ? 'bg-dark' : 'bg-gradient-primary text-white';

  // FAQ data
  const faqData = {
    general: [
      {
        id: 'gen-1',
        question: "What is the IT Helpdesk Request Tracker?",
        answer: "The IT Helpdesk Request Tracker is a comprehensive system designed to manage and track all IT support requests within the Ethiopian Statistical Service. It streamlines the process of reporting issues, tracking progress, and ensuring timely resolution of technical problems."
      },
      {
        id: 'gen-2',
        question: "Who can use this system?",
        answer: "All Ethiopian Statistical Service employees can use this system to report IT issues. The system supports different user roles: Regular Users (employees), Senior IT Officers, and Administrators, each with appropriate access levels."
      },
      {
        id: 'gen-3',
        question: "What types of issues can I report?",
        answer: "You can report various IT-related issues including: Hardware problems (computers, printers, peripherals), Software issues (applications, operating systems), Network connectivity problems, Account and access issues, Security concerns, Database problems, and other technical difficulties."
      }
    ],
    gettingStarted: [
      {
        id: 'gs-1',
        question: "How do I create my first ticket?",
        answer: "To create your first ticket: 1) Click on 'New Ticket' or 'Submit Ticket' button, 2) Fill in the required information including issue description and priority, 3) Provide detailed steps to reproduce the problem, 4) Submit the ticket. You'll receive a confirmation and can track progress in your dashboard."
      },
      {
        id: 'gs-2',
        question: "What information should I include in my ticket?",
        answer: "For faster resolution, include: Clear description of the problem, Steps to reproduce the issue, Error messages (if any), Affected software/hardware, Urgency level, Your contact information, and any relevant screenshots or attachments."
      },
      {
        id: 'gs-3',
        question: "How do I check my ticket status?",
        answer: "You can check your ticket status by: 1) Visiting your User Dashboard, 2) Viewing the 'Recent Tickets' section, 3) Checking the status column (Open, Queued, In Progress, Resolved, Closed), 4) Clicking on individual tickets for detailed progress updates."
      }
    ],
    ticketManagement: [
      {
        id: 'tm-1',
        question: "What do the different ticket statuses mean?",
        answer: `📋 Open: Ticket created, awaiting assignment\n⏳ Queued: Waiting for available IT officer (position shown)\n🔄 In Progress: Assigned officer is working on it\n✅ Resolved: Issue fixed, awaiting your confirmation\n🔒 Closed: Ticket completed and archived`
      },
      {
        id: 'tm-2',
        question: "How long does it take to resolve a ticket?",
        answer: "Resolution times vary based on: Priority level (High: 2-4 hours, Medium: 1-2 days, Low: 3-5 days), Complexity of the issue, Current queue length, and Resource availability. You can see estimated wait times in your ticket details."
      },
      {
        id: 'tm-3',
        question: "Can I edit or update my ticket after submission?",
        answer: "Yes, you can edit tickets that are in 'Open', 'Queued', or 'In Progress' status. Use the 'Edit' button in your ticket list to add additional information or update details. Once resolved or closed, tickets cannot be edited."
      },
      {
        id: 'tm-4',
        question: "What happens if my ticket is in queue?",
        answer: "When your ticket is queued, it means all IT officers are currently handling their maximum workload (3 tickets each). Your ticket will automatically move to 'In Progress' when an officer becomes available. You can see your queue position in the ticket details."
      }
    ],
    priorities: [
      {
        id: 'pri-1',
        question: "How are ticket priorities determined?",
        answer: `🔴 High: Critical system failures, multiple users affected, security incidents\n🟡 Medium: Single user productivity issues, non-critical software problems\n🟢 Low: General inquiries, minor configuration changes, non-urgent requests\n\nPriority affects response time and resource allocation.`
      },
      {
        id: 'pri-2',
        question: "Can I change the priority of my ticket?",
        answer: "You can set the initial priority when creating the ticket. If the situation changes, you can contact the assigned IT officer or update the ticket description. For emergency situations, please contact IT support directly."
      }
    ],
    technical: [
      {
        id: 'tech-1',
        question: "What should I do if I can't access the system?",
        answer: "If you cannot access the system: 1) Check your internet connection, 2) Clear browser cache and cookies, 3) Try using a different browser, 4) Contact IT support via phone or email for immediate assistance."
      },
      {
        id: 'tech-2',
        question: "How do I reset my password?",
        answer: "Use the 'Forgot Password' link on the login page. You'll receive an email with instructions to reset your password. If you don't receive the email, contact IT support directly."
      },
      {
        id: 'tech-3',
        question: "What browsers are supported?",
        answer: "The system works best with: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Ensure JavaScript is enabled and you're using an updated browser version for optimal performance."
      }
    ],
    contact: [
      {
        id: 'con-1',
        question: "How do I contact IT support directly?",
        answer: `📞 Phone: +251-XXX-XXXX (during business hours)\n📧 Email: it-support@ess.gov.et\n🏢 Office: Building A, 3rd Floor, IT Department\n⏰ Hours: Monday-Friday, 8:30 AM - 5:30 PM\n\nFor after-hours emergencies, contact security who will reach on-call IT staff.`
      },
      {
        id: 'con-2',
        question: "When should I call instead of creating a ticket?",
        answer: "Call IT support directly for: System-wide outages, Security incidents, Urgent access issues, or When you cannot access the ticketing system. For routine issues, please use the ticketing system for proper tracking."
      }
    ]
  };

  // Quick solutions with detailed steps
  const quickSolutions = [
    {
      id: 1,
      problem: "Can't login to system",
      solution: "Use password reset or contact IT support",
      steps: [
        "Click 'Forgot Password' on the login page",
        "Check your registered email for the reset link",
        "Create a new strong password",
        "Try logging in with the new credentials"
      ],
      category: "access",
      icon: "🔐",
      color: "primary"
    },
    {
      id: 2,
      problem: "Printer not working",
      solution: "Check connections, restart printer, verify queue",
      steps: [
        "Check all cable connections (power, USB, network)",
        "Restart both printer and computer",
        "Clear any stuck print jobs in the queue",
        "Update printer drivers from manufacturer's website"
      ],
      category: "hardware",
      icon: "🖨️",
      color: "warning"
    },
    {
      id: 3,
      problem: "Email issues",
      solution: "Check internet, clear cache, verify credentials",
      steps: [
        "Verify internet connectivity is stable",
        "Clear browser cache and cookies",
        "Check email server settings",
        "Try accessing webmail as alternative"
      ],
      category: "software",
      icon: "📧",
      color: "info"
    },
    {
      id: 4,
      problem: "Slow computer",
      solution: "Restart computer, close unused applications",
      steps: [
        "Perform a full system restart",
        "Close unnecessary background applications",
        "Clear temporary files and cache",
        "Run system maintenance tools"
      ],
      category: "performance",
      icon: "💻",
      color: "success"
    },
    {
      id: 5,
      problem: "Network connection",
      solution: "Check cables, restart router, verify WiFi",
      steps: [
        "Check all physical cable connections",
        "Restart router and modem",
        "Forget and reconnect to WiFi network",
        "Run network diagnostic tools"
      ],
      category: "network",
      icon: "🌐",
      color: "danger"
    },
    {
      id: 6,
      problem: "Software installation",
      solution: "Check permissions, download source, follow guide",
      steps: [
        "Verify you have installation permissions",
        "Download from official sources only",
        "Follow installation wizard steps",
        "Restart computer after installation"
      ],
      category: "software",
      icon: "💿",
      color: "purple"
    }
  ];

  // Help sections with actual content
  const helpSections = {
    settings: {
      id: 'settings',
      title: "Help with settings and billing",
      description: "Subscriptions and licenses",
      icon: "⚙️",
      color: "blue",
      content: [
        {
          title: "How to update subscription plan",
          answer: "Navigate to Billing > Subscription > Change Plan. Select your new plan and confirm payment."
        },
        {
          title: "Managing licenses",
          answer: "Go to Settings > Licenses to view, add, or remove user licenses. Each license covers one user account."
        },
        {
          title: "Billing cycle information",
          answer: "Billing occurs monthly/annually. You'll receive invoices via email 7 days before renewal."
        },
        {
          title: "Payment methods",
          answer: "We accept bank transfers, credit cards, and mobile payment. Update payment methods in Billing > Payment."
        }
      ]
    },
    account: {
      id: 'account',
      title: "General account administration",
      description: "How to solve general issues with the account",
      icon: "👤",
      color: "green",
      content: [
        {
          title: "Account recovery",
          answer: "If you lose access, contact admin with your employee ID. Verification takes 1-2 business days."
        },
        {
          title: "Profile updates",
          answer: "Update personal info in Profile > Edit. Changes require admin approval for verification."
        },
        {
          title: "Account deactivation",
          answer: "Submit deactivation request to HR department. All tickets will be transferred to another user."
        },
        {
          title: "Multiple account issues",
          answer: "Each employee should have only one account. Report duplicates to IT department immediately."
        },
        {
          title: "Session management",
          answer: "Manage active sessions in Security > Active Sessions. You can log out from all devices here."
        }
      ]
    },
    payments: {
      id: 'payments',
      title: "How to solve issues with payments",
      description: "Payment methods and troubleshooting",
      icon: "💳",
      color: "purple",
      content: [
        {
          title: "Failed payment",
          answer: "Check card details and balance. Failed payments retry automatically after 24 hours."
        },
        {
          title: "Refund requests",
          answer: "Submit refund request via Billing > Refunds. Include reason and transaction details."
        },
        {
          title: "Payment history",
          answer: "View all transactions in Billing > History. Export reports for accounting purposes."
        },
        {
          title: "Invoice disputes",
          answer: "Contact billing@ess.gov.et with invoice number and dispute details within 30 days."
        }
      ]
    },
    access: {
      id: 'access',
      title: "How to manage user access",
      description: "Permissions, roles, and security settings",
      icon: "👥",
      color: "orange",
      content: [
        {
          title: "Role assignment",
          answer: "Admins can assign roles in Users > Manage Roles. Each role has predefined permissions."
        },
        {
          title: "Permission levels",
          answer: "Three levels: Read (view only), Write (create/edit), Admin (full control including user management)."
        },
        {
          title: "Access requests",
          answer: "Submit access request form to department head. Approval required before access is granted."
        },
        {
          title: "Security groups",
          answer: "Create groups for departments. Group permissions override individual settings."
        },
        {
          title: "Access logs",
          answer: "View all access attempts in Security > Access Logs. Monitor for suspicious activity."
        },
        {
          title: "Emergency access",
          answer: "Contact security team for emergency access outside business hours. Documentation required."
        }
      ]
    }
  };

  // Resources data
  const resources = [
    {
      id: 1,
      title: "User Manual",
      description: "Complete guide to using the system",
      icon: "fas fa-file-pdf",
      color: "primary",
      action: () => {
        console.log("Opening User Manual");
        alert("User Manual would open in a new window");
      }
    },
    {
      id: 2,
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      icon: "fas fa-video",
      color: "success",
      action: () => {
        console.log("Opening Video Tutorials");
        alert("Redirecting to Video Tutorials section");
      }
    },
    {
      id: 3,
      title: "Community Forum",
      description: "Get help from other users",
      icon: "fas fa-comments",
      color: "warning",
      action: () => {
        console.log("Opening Community Forum");
        alert("Opening Community Forum in new tab");
      }
    },
    {
      id: 4,
      title: "API Documentation",
      description: "Developer guides and API references",
      icon: "fas fa-code",
      color: "info",
      action: () => {
        console.log("Opening API Documentation");
        alert("API Documentation would open");
      }
    }
  ];

  const toggleExpansion = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSolutionExpansion = (solutionId) => {
    setExpandedSolution(expandedSolution === solutionId ? null : solutionId);
  };

  const handleCreateTicket = () => {
    if (isLoggedIn) {
      navigate('/submit-ticket');
    } else {
      navigate('/login');
    }
  };

  const handleViewTickets = () => {
    if (isLoggedIn) {
      navigate('/user-dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleLike = (itemId) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        alert("You unliked this answer");
      } else {
        newSet.add(itemId);
        setDislikedItems(prevDisliked => {
          const newDisliked = new Set(prevDisliked);
          newDisliked.delete(itemId);
          return newDisliked;
        });
        alert("Thanks for liking this answer!");
      }
      return newSet;
    });
  };

  const handleDislike = (itemId) => {
    setDislikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        alert("You undisliked this answer");
      } else {
        newSet.add(itemId);
        setLikedItems(prevLiked => {
          const newLiked = new Set(prevLiked);
          newLiked.delete(itemId);
          return newLiked;
        });
        alert("We'll improve this answer based on your feedback");
      }
      return newSet;
    });
  };

  const handleShare = (item) => {
    const shareText = `${item.question}\n\n${item.answer}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Help FAQ - Ethiopian Statistical Service',
        text: shareText,
        url: window.location.href
      })
      .then(() => console.log('Shared successfully'))
      .catch(error => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => {
          alert('FAQ content copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          alert('Failed to copy to clipboard');
        });
    }
  };

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    setSearchTerm('');
  };

  const handleBackToFAQ = () => {
    setActiveSection(null);
  };

  const filteredFAQs = Object.entries(faqData).reduce((acc, [category, items]) => {
    const filteredItems = items.filter(item => 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredItems.length > 0) {
      acc[category] = filteredItems;
    }
    return acc;
  }, {});

  const categoryTitles = {
    general: "📋 General Information",
    gettingStarted: "🚀 Getting Started",
    ticketManagement: "🎫 Ticket Management",
    priorities: "🎯 Priorities & Urgency",
    technical: "🔧 Technical Support",
    contact: "📞 Contact & Support"
  };

  return (
    <div className={`min-vh-100 ${bgClass} ${textClass}`}>
      {/* Modern Header */}
      <div className={`${headerBgClass} py-4`} style={{
        background: isDarkMode ? '#1a1a1a' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="container-fluid px-5">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 fw-bold mb-0 text-white">
                <i className="fas fa-headset me-2"></i>
                Help and FAQs
              </h1>
              <p className="text-white-50 mb-0">Find solutions for common issues</p>
            </div>
            <div className="d-flex gap-3">
              <button 
                className="btn btn-light"
                onClick={handleCreateTicket}
              >
                <i className="fas fa-plus-circle me-2"></i>
                New Ticket
              </button>
              {isLoggedIn && (
                <button 
                  className="btn btn-outline-light"
                  onClick={handleViewTickets}
                >
                  <i className="fas fa-ticket-alt me-2"></i>
                  My Tickets
                </button>
              )}
              <Link to="/" className="btn btn-outline-light">
                <i className="fas fa-home me-2"></i>
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Content */}
      <div className="container-fluid px-5 py-4">
        {/* Search Bar */}
        <div className="row mb-5">
          <div className="col-12">
            <div className={`card ${cardBgClass} border ${borderClass} shadow`}>
              <div className="card-body p-4">
                <h4 className="mb-3">
                  <i className="fas fa-search me-2 text-primary"></i>
                  Search for help
                </h4>
                <div className="input-group input-group-lg">
                  <input
                    type="text"
                    className="form-control border-2"
                    placeholder="Type your question or keywords here..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-primary px-4">
                    <i className="fas fa-search me-2"></i>
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="row">
          {/* Left Column - Help Sections */}
          <div className="col-lg-4 mb-4">
            {/* Quick Actions */}
            <div className={`card ${cardBgClass} border ${borderClass} shadow mb-4`}>
              <div className="card-header bg-transparent border-bottom">
                <h5 className="mb-0">
                  <i className="fas fa-bolt me-2 text-warning"></i>
                  Quick Actions
                </h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary text-start" onClick={() => alert('Downloading User Guide...')}>
                    <i className="fas fa-download me-2"></i>
                    Download User Guide
                  </button>
                  <button className="btn btn-outline-success text-start" onClick={() => alert('Opening Tutorial Videos...')}>
                    <i className="fas fa-video me-2"></i>
                    Watch Tutorial Videos
                  </button>
                  <button className="btn btn-outline-info text-start" onClick={() => alert('Opening Documentation...')}>
                    <i className="fas fa-file-alt me-2"></i>
                    View Documentation
                  </button>
                  <button className="btn btn-outline-warning text-start" onClick={() => navigate('/contact')}>
                    <i className="fas fa-phone-alt me-2"></i>
                    Contact Support
                  </button>
                </div>
              </div>
            </div>

            {/* Browse Help Sections - FUNCTIONAL */}
            <div className={`card ${cardBgClass} border ${borderClass} shadow`}>
              <div className="card-header bg-transparent border-bottom">
                <h5 className="mb-0">
                  <i className="fas fa-th-large me-2 text-primary"></i>
                  Browse Help Sections
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {Object.values(helpSections).map((section) => (
                    <div key={section.id} className="col-md-6 col-lg-12">
                      <div 
                        className={`card border ${borderClass} cursor-pointer transition-all hover-shadow ${activeSection === section.id ? 'border-primary border-2' : ''}`}
                        onClick={() => handleSectionClick(section.id)}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center gap-3">
                            <div className={`bg-${section.color}-subtle p-2 rounded`}>
                              <span className="fs-4">{section.icon}</span>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="fw-bold mb-1">{section.title}</h6>
                              <p className="text-muted small mb-0">{section.description}</p>
                            </div>
                            <div className="text-end">
                              <span className="badge bg-secondary">{section.content.length} articles</span>
                              <div className="mt-1">
                                <i className={`fas fa-chevron-${activeSection === section.id ? 'up' : 'right'} text-primary`}></i>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <button className="btn btn-link text-decoration-none" onClick={() => alert('Loading all sections...')}>
                    <i className="fas fa-arrow-right me-1"></i>
                    See all 4 subsections →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="col-lg-8">
            {/* Show Help Section Content or Default FAQ */}
            {activeSection ? (
              <>
                {/* Help Section Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h3 className="fw-bold mb-1">
                      <i className={helpSections[activeSection].icon}></i>
                      {' '}{helpSections[activeSection].title}
                    </h3>
                    <p className="text-muted mb-0">{helpSections[activeSection].description}</p>
                  </div>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleBackToFAQ}
                  >
                    <i className="fas fa-arrow-left me-1"></i>
                    Back to FAQ
                  </button>
                </div>

                {/* Help Section Content */}
                <div className={`card ${cardBgClass} border ${borderClass} shadow mb-5`}>
                  <div className="card-body p-0">
                    {helpSections[activeSection].content.map((item, index) => (
                      <div key={index} className="border-bottom">
                        <div className="p-4">
                          <div className="d-flex align-items-start gap-3">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                              <i className="fas fa-file-alt text-primary"></i>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="fw-bold mb-2">{item.title}</h5>
                              <p className="mb-0">{item.answer}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Default Content: Quick Solutions & FAQ */}
                {/* Quick Solutions Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h3 className="fw-bold mb-1">
                      <i className="fas fa-lightbulb me-2 text-warning"></i>
                      Quick Solutions for Common Problems
                    </h3>
                    <p className="text-muted mb-0">Immediate fixes for frequently reported issues</p>
                  </div>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => alert('Filter functionality would open here')}
                  >
                    <i className="fas fa-filter me-1"></i>
                    Filter
                  </button>
                </div>

                {/* Quick Solutions Grid */}
                <div className="row g-4 mb-5">
                  {quickSolutions.map((solution) => (
                    <div key={solution.id} className="col-md-6">
                      <div className={`card ${cardBgClass} border ${borderClass} shadow-sm h-100`}>
                        <div className="card-body p-4">
                          <div className="d-flex align-items-start gap-3 mb-3">
                            <div className={`bg-${solution.color}-subtle p-3 rounded-circle`}>
                              <span className="fs-3">{solution.icon}</span>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="fw-bold mb-1">{solution.problem}</h5>
                              <p className="text-muted mb-2">{solution.solution}</p>
                              <span className={`badge bg-${solution.color} text-white`}>
                                {solution.category}
                              </span>
                            </div>
                          </div>
                          
                          {/* Steps Section - Hidden by default, shown when expanded */}
                          {expandedSolution === solution.id && (
                            <div className="mt-3 pt-3 border-top">
                              <h6 className="fw-bold mb-2">Step-by-Step Solution:</h6>
                              <ol className="ps-3 mb-3">
                                {solution.steps.map((step, idx) => (
                                  <li key={idx} className="mb-2">
                                    <span className="text-dark">{step}</span>
                                  </li>
                                ))}
                              </ol>
                              <div className="alert alert-info mb-0">
                                <i className="fas fa-info-circle me-2"></i>
                                If these steps don't resolve your issue, please create a support ticket.
                              </div>
                            </div>
                          )}
                          
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <small className="text-muted">
                              <i className="fas fa-list-ol me-1"></i>
                              {solution.steps.length} steps
                            </small>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => toggleSolutionExpansion(solution.id)}
                            >
                              {expandedSolution === solution.id ? 'Hide Details' : 'View Details'} 
                              <i className={`fas fa-chevron-${expandedSolution === solution.id ? 'up' : 'right'} ms-1`}></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FAQ Categories Navigation */}
                <div className={`card ${cardBgClass} border ${borderClass} shadow mb-4`}>
                  <div className="card-body p-3">
                    <div className="d-flex flex-wrap gap-2">
                      {Object.keys(categoryTitles).map(category => (
                        <button
                          key={category}
                          className={`btn ${activeCategory === category ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                          onClick={() => {
                            setSearchTerm('');
                            setActiveCategory(category);
                          }}
                        >
                          {categoryTitles[category]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* FAQ Content */}
                <div className={`card ${cardBgClass} border ${borderClass} shadow`}>
                  <div className="card-header bg-transparent border-bottom">
                    <h4 className="mb-0">{categoryTitles[activeCategory]}</h4>
                  </div>
                  <div className="card-body p-0">
                    {(searchTerm ? Object.entries(filteredFAQs) : [[activeCategory, faqData[activeCategory]]]).map(([category, items]) => (
                      <div key={category} className="accordion" id="faqAccordion">
                        {items.map((item, index) => {
                          const globalIndex = item.id;
                          const isExpanded = expandedItems.has(globalIndex);
                          const isLiked = likedItems.has(globalIndex);
                          const isDisliked = dislikedItems.has(globalIndex);
                          
                          return (
                            <div key={globalIndex} className="border-bottom">
                              <div 
                                className="p-4 d-flex justify-content-between align-items-center cursor-pointer"
                                onClick={() => toggleExpansion(globalIndex)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="d-flex align-items-start gap-3">
                                  <div className={`bg-${isExpanded ? 'primary' : 'light'} text-${isExpanded ? 'white' : 'primary'} p-2 rounded-circle`}>
                                    <i className="fas fa-question"></i>
                                  </div>
                                  <div>
                                    <h5 className="mb-1">{item.question}</h5>
                                    <small className="text-muted">
                                      {categoryTitles[category].replace(/^[^ ]+ /, '')}
                                    </small>
                                  </div>
                                </div>
                                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-primary`}></i>
                              </div>
                              {isExpanded && (
                                <div className="px-4 pb-4">
                                  <div className="ps-5">
                                    <div className="p-3 bg-light rounded">
                                      <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                                        {item.answer}
                                      </p>
                                    </div>
                                    <div className="d-flex gap-2 mt-3">
                                      <button 
                                        className={`btn btn-sm ${isLiked ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleLike(globalIndex);
                                        }}
                                      >
                                        <i className={`fas fa-thumbs-up ${isLiked ? 'text-white' : ''} me-1`}></i> 
                                        {isLiked ? 'Liked' : 'Helpful'}
                                      </button>
                                      <button 
                                        className={`btn btn-sm ${isDisliked ? 'btn-danger' : 'btn-outline-danger'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDislike(globalIndex);
                                        }}
                                      >
                                        <i className={`fas fa-thumbs-down ${isDisliked ? 'text-white' : ''} me-1`}></i> 
                                        {isDisliked ? 'Disliked' : 'Not Helpful'}
                                      </button>
                                      <button 
                                        className="btn btn-sm btn-outline-primary ms-auto"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleShare(item);
                                        }}
                                      >
                                        <i className="fas fa-share me-1"></i> Share
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    {searchTerm && Object.keys(filteredFAQs).length === 0 && (
                      <div className="text-center py-5">
                        <i className="fas fa-search fa-3x text-muted mb-3"></i>
                        <h4 className="text-muted mb-3">No results found</h4>
                        <p className="text-muted mb-4">
                          Try different search terms or browse the categories above.
                        </p>
                        <button 
                          className="btn btn-primary"
                          onClick={() => setSearchTerm('')}
                        >
                          Clear Search
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Additional Resources - FULL SCREEN WIDTH */}
      <div className="container-fluid px-0 mt-5">
        <div className={`${isDarkMode ? 'bg-secondary' : 'bg-white'} py-5`}>
          <div className="container-fluid px-5">
            {/* Header with View All button */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="fw-bold mb-0">
                    <i className="fas fa-box-open me-2 text-primary"></i>
                    Additional Resources
                  </h2>
                  <button 
                    className="btn btn-outline-primary btn-lg"
                    onClick={() => alert('Opening all resources...')}
                  >
                    View All <i className="fas fa-arrow-right ms-2"></i>
                  </button>
                </div>
                <p className="text-muted mt-2 mb-0">Access helpful guides and learning materials</p>
              </div>
            </div>

            {/* Resources Grid - Full Width Horizontal Layout */}
            <div className="row g-4">
              {resources.map((resource) => (
                <div key={resource.id} className="col-xxl-3 col-xl-3 col-lg-6 col-md-6 col-sm-12">
                  <div className={`card border ${borderClass} h-100 shadow-hover`} 
                    style={{
                      transition: 'all 0.3s ease',
                      minHeight: '280px'
                    }}
                  >
                    <div className="card-body p-4 d-flex flex-column">
                      {/* Icon with background */}
                      <div className={`bg-${resource.color} bg-opacity-10 p-3 rounded-3 d-inline-block mb-4`} 
                        style={{ width: '70px', height: '70px' }}>
                        <div className="d-flex align-items-center justify-content-center h-100">
                          <i className={`${resource.icon} fa-2x text-${resource.color}`}></i>
                        </div>
                      </div>
                      
                      {/* Title and Description */}
                      <h4 className="fw-bold mb-2" style={{ fontSize: '1.3rem' }}>
                        {resource.title}
                      </h4>
                      <p className="text-muted mb-4 flex-grow-1" style={{ 
                        fontSize: '1.05rem',
                        lineHeight: '1.6'
                      }}>
                        {resource.description}
                      </p>
                      
                      {/* Action Button */}
                      <button 
                        className="btn btn-primary btn-lg mt-auto"
                        onClick={resource.action}
                        style={{ padding: '0.75rem 1.5rem' }}
                      >
                        <i className="fas fa-external-link-alt me-2"></i>
                        Open Resource
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Extra Info Row */}
            <div className="row mt-5 pt-4">
              <div className="col-12">
                <div className={`card border ${borderClass} bg-light bg-opacity-10`}>
                  <div className="card-body p-4">
                    <div className="row align-items-center">
                      <div className="col-lg-8">
                        <h5 className="fw-bold mb-2">Need more resources?</h5>
                        <p className="text-muted mb-0">
                          Explore our complete documentation library, watch tutorial videos, 
                          join community discussions, and access API references for developers.
                        </p>
                      </div>
                      <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
                        <button className="btn btn-outline-primary btn-lg">
                          <i className="fas fa-book-open me-2"></i>
                          Browse All Resources
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section - Full Width */}
      <div className="container-fluid px-0 mt-4">
        <div className={`${isDarkMode ? 'bg-dark' : 'bg-light'} py-4`}>
          <div className="container-fluid px-5">
            <div className="row text-center">
              <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-3">
                <div className="p-3">
                  <h2 className="text-primary fw-bold display-5">98%</h2>
                  <p className="text-muted mb-0 fs-5">Resolution Rate</p>
                </div>
              </div>
              <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-3">
                <div className="p-3">
                  <h2 className="text-success fw-bold display-5">4.8★</h2>
                  <p className="text-muted mb-0 fs-5">User Satisfaction</p>
                </div>
              </div>
              <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-3">
                <div className="p-3">
                  <h2 className="text-warning fw-bold display-5">15min</h2>
                  <p className="text-muted mb-0 fs-5">Avg. First Response</p>
                </div>
              </div>
              <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-3">
                <div className="p-3">
                  <h2 className="text-info fw-bold display-5">99.9%</h2>
                  <p className="text-muted mb-0 fs-5">System Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Full Width */}
      <footer className={`${isDarkMode ? 'bg-dark' : 'bg-dark text-white'} py-5`}>
        <div className="container-fluid px-5">
          <div className="row">
            <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-6 col-sm-12 mb-4">
              <h6 className="fw-bold mb-3 fs-5">
                <i className="fas fa-headset me-2 text-primary"></i>
                IT Help Desk System
              </h6>
              <p className="text-light opacity-75" style={{ fontSize: '1.05rem' }}>
                Ethiopian Statistical Service<br />
                Comprehensive IT support system
              </p>
              <div className="d-flex gap-3">
                <a href="#" className="text-light fs-5" onClick={() => alert('Twitter would open')}>
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-light fs-5" onClick={() => alert('Facebook would open')}>
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" className="text-light fs-5" onClick={() => alert('LinkedIn would open')}>
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="#" className="text-light fs-5" onClick={() => alert('Telegram would open')}>
                  <i className="fab fa-telegram"></i>
                </a>
              </div>
            </div>
            <div className="col-xxl-2 col-xl-2 col-lg-2 col-md-3 col-sm-6 mb-4">
              <h6 className="fw-bold mb-3 fs-5">Quick Links</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link to="/" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                    Home
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/help" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                    Help Center
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/submit-ticket" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                    Submit Ticket
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/dashboard" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
              <h6 className="fw-bold mb-3 fs-5">Support</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link to="/contact" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                    Contact Support
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/docs" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                    Documentation
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/status" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                    System Status
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/training" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                    Training
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-12 mb-4">
              <h6 className="fw-bold mb-3 fs-5">Contact Info</h6>
              <ul className="list-unstyled text-light opacity-75" style={{ fontSize: '1.05rem' }}>
                <li className="mb-3">
                  <i className="fas fa-phone me-3 text-primary"></i>
                  <span>+251-XXX-XXXX</span>
                </li>
                <li className="mb-3">
                  <i className="fas fa-envelope me-3 text-primary"></i>
                  <span>support@ess.gov.et</span>
                </li>
                <li className="mb-3">
                  <i className="fas fa-clock me-3 text-primary"></i>
                  <span>Mon-Fri: 8:30 AM - 5:30 PM</span>
                </li>
                <li className="mb-3">
                  <i className="fas fa-map-marker-alt me-3 text-primary"></i>
                  <span>Building A, 3rd Floor</span>
                </li>
              </ul>
            </div>
          </div>
          <hr className="my-4 opacity-25" />
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <p className="text-light opacity-75 mb-3 mb-md-0" style={{ fontSize: '1.05rem' }}>
              <i className="fas fa-copyright me-2"></i>
              {new Date().getFullYear()} Ethiopian Statistical Service. All rights reserved.
            </p>
            <div className="d-flex gap-4">
              <Link to="/privacy" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: '1.05rem' }}>
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelpFAQ;