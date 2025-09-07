# Enhanced Capacity Analysis with Field-Level Details and Confluence Export

## 🎯 **What's New**

### **1. Detailed Field-Level Analysis**
- **Per-field capacity breakdown** with data type analysis
- **Average vs Maximum size** calculations for each field
- **Overhead analysis** (null bitmap, row header, alignment)
- **Storage optimization recommendations** per field

### **2. Confluence Wiki Export**
- **One-click copy** to Confluence wiki format
- **Customizable export options** (field details, recommendations, overhead)
- **Professional report formatting** with tables and color coding
- **Multiple export formats** (Wiki, Summary, Field Analysis, Raw JSON)

### **3. Enhanced UI Features**
- **Toggle field details** visibility
- **Toggle overhead analysis** display
- **Export settings panel** with checkboxes
- **Field-level tooltips** and descriptions

---

## 📋 **Sample DDL for Testing**

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(64) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    birth_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    profile_data JSON,
    avatar_url TEXT
);

CREATE TABLE orders (
    order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_number VARCHAR(32) NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔍 **Expected Analysis Output**

### **Field-Level Breakdown Example:**

| Field | Data Type | Nullable | Avg Size | Max Size | Overhead | Description |
|-------|-----------|----------|----------|----------|----------|-------------|
| `id` | `BIGINT` | ✗ | 8 B | 8 B | 0 B | Fixed-size 64-bit integer, no overhead |
| `username` | `VARCHAR(50)` | ✗ | 12 B | 50 B | 1 B | Variable length + length prefix |
| `email` | `VARCHAR(255)` | ✗ | 25 B | 255 B | 2 B | Variable length + 2-byte length prefix |
| `profile_data` | `JSON` | ✓ | 100 B | 16 MB | 4 B | Variable length JSON + length overhead |

### **Row Overhead Analysis:**
- **Null Bitmap**: 2 bytes (tracks 8 nullable columns)
- **Row Header**: 8 bytes (MySQL InnoDB metadata) 
- **Alignment Padding**: 4 bytes (8-byte alignment)
- **Total Overhead**: 14 bytes per record

---

## 📊 **Confluence Wiki Export Sample**

```confluence
h1. Database Capacity Analysis Report

|| *Database Type* | MYSQL |
|| *Record Count* | 1,000,000 |
|| *Analysis Date* | 2025-01-09 15:30:45 |

h2. Executive Summary

|| *Metric* || *Average Case* || *Maximum Case* ||
| Record Size | 245 B | 1.2 KB |
| Total Data Size | 245 MB ({color:blue}245.00 MB{color}) | 1.2 GB ({color:red}1,200.00 MB{color}) |
| Index Size | {color:purple}98 MB (98.00 MB){color} | {color:purple}98 MB (98.00 MB){color} |
| Total with Index | {color:green}343 MB (343.00 MB){color} | {color:orange}1.3 GB (1,298.00 MB){color} |

h2. Table Breakdown Analysis

h3. Table: `users`

|| *Metric* || *Average* || *Maximum* ||
| Record Size | 187 B | 890 B |
| Total Size | 187 MB (187.00 MB) | 890 MB (890.00 MB) |
| Record Count | {color:blue}1,000,000{color} | {color:blue}1,000,000{color} |

h4. Field-Level Capacity Analysis

|| *Field Name* || *Data Type* || *Nullable* || *Avg Size* || *Max Size* || *Overhead* || *Description* ||
| `id` | `BIGINT` | {color:green}✗{color} | 8 B | 8 B | 0 B | Fixed-size 64-bit integer primary key |
| `username` | `VARCHAR(50)` | {color:green}✗{color} | 12 B | 50 B | 1 B | Variable string with 1-byte length prefix for strings <256 |
| `email` | `VARCHAR(255)` | {color:green}✗{color} | 25 B | 255 B | 2 B | Variable string with 2-byte length prefix |
```

---

## ⚙️ **Export Options**

### **1. Copy Confluence Wiki** 
- Complete report in Confluence markup format
- Ready to paste into Confluence pages
- Includes color coding and professional formatting

### **2. Copy Summary Table**
- Executive summary only
- Perfect for quick overviews
- Confluence table format

### **3. Copy Field Analysis** 
- Detailed field-by-field breakdown
- Technical analysis for database architects
- Includes storage optimization notes

### **4. Copy Raw JSON**
- Complete technical data
- For further processing or API integration
- Includes all calculated metrics

---

## 🎛️ **Export Customization**

**Confluence Export Settings:**
- ☑️ **Include Field Details** - Show per-field analysis
- ☑️ **Include Recommendations** - Add optimization suggestions  
- ☑️ **Include Overhead Analysis** - Show row-level overhead breakdown

**Display Toggles:**
- 👁️ **Show/Hide Field Details** - Toggle field-level breakdown
- ⚙️ **Show/Hide Overhead** - Toggle overhead analysis display

---

## 🚀 **Usage Instructions**

1. **Input DDL Schema** - Paste your CREATE TABLE statements
2. **Configure Analysis** - Select database type and record count
3. **Run Analysis** - Click "Phân tích chi tiết" 
4. **View Results** - Explore field-level details and overhead analysis
5. **Export Report** - Choose export format and copy to clipboard
6. **Paste to Confluence** - Directly paste formatted wiki markup

---

## 💡 **Key Benefits**

### **For Database Architects:**
- **Precise capacity planning** with field-level granularity
- **Storage optimization insights** per data type
- **Overhead impact analysis** for performance tuning

### **For Documentation:**
- **Professional reports** ready for Confluence
- **Standardized formatting** across teams
- **Easy sharing and collaboration** 

### **For Project Management:**
- **Accurate storage estimates** for infrastructure planning
- **Scalability projections** with detailed breakdowns
- **Technical documentation** that stakeholders can understand

---

*This enhanced version provides enterprise-level capacity analysis with professional reporting capabilities suitable for technical documentation and infrastructure planning.*