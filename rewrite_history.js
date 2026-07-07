const fs = require('fs');
const path = 'app-vendor/src/app/operations/supplier/[id].tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.transactionHeaderRow}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search history..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Table Container */}
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>DATE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>TYPE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>QTY</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right', color: Colors.textPrimary }]}>COST</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right' }]}>SELLING</Text>
            </View>
            <View style={styles.tableHeaderLine} />

            {/* Table Rows */}
            {DUMMY_TRANSACTIONS.map((txn, index) => (
              <Animated.View key={txn.id} entering={FadeIn.delay(index * 50)} style={[styles.tableRow, index === DUMMY_TRANSACTIONS.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={[styles.tableRowText, { flex: 1.5 }]}>{txn.date}</Text>
                <Text style={[styles.tableRowText, { flex: 1, color: txn.type === 'Purchase' ? Colors.success : Colors.danger }]}>{txn.type}</Text>
                <Text style={[styles.tableRowText, { flex: 1, textAlign: 'right' }]}>{txn.qty}</Text>
                <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{txn.cost}</Text>
                <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right' }]}>₹{txn.sell}</Text>
              </Animated.View>
            ))}
          </View>
        </View>`;

const replacementStr = `        {/* Transaction History (Financials) */}
        <View style={styles.section}>
          <View style={styles.transactionHeaderRow}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>DATE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>REF #</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>STATUS</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right', color: Colors.textPrimary }]}>AMOUNT</Text>
            </View>
            <View style={styles.tableHeaderLine} />

            {[
              { id: 't1', date: 'Oct 24, 2023', ref: 'INV-001', status: 'Paid', amount: 45000 },
              { id: 't2', date: 'Nov 02, 2023', ref: 'INV-002', status: 'Pending', amount: 12500 },
            ].map((txn, index) => (
              <Animated.View key={txn.id} entering={FadeIn.delay(index * 50)} style={[styles.tableRow, index === 1 && { borderBottomWidth: 0 }]}>
                <Text style={[styles.tableRowText, { flex: 1.5 }]}>{txn.date}</Text>
                <Text style={[styles.tableRowText, { flex: 1.5, color: Colors.primary }]}>{txn.ref}</Text>
                <Text style={[styles.tableRowText, { flex: 1, color: txn.status === 'Paid' ? Colors.success : Colors.warningDark }]}>{txn.status}</Text>
                <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{txn.amount}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Stock History (Movements) */}
        <View style={styles.section}>
          <View style={styles.transactionHeaderRow}>
            <Text style={styles.sectionTitle}>Stock History</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search stock movements..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>DATE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>PRODUCT</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>TYPE</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: 'right' }]}>QTY</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>COST</Text>
            </View>
            <View style={styles.tableHeaderLine} />

            {DUMMY_TRANSACTIONS.map((txn, index) => (
              <Animated.View key={txn.id} entering={FadeIn.delay(index * 50)} style={[styles.tableRow, index === DUMMY_TRANSACTIONS.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={[styles.tableRowText, { flex: 1.2 }]}>{txn.date}</Text>
                <Text style={[styles.tableRowText, { flex: 1.5 }]} numberOfLines={1}>Premium Rice 5kg</Text>
                <Text style={[styles.tableRowText, { flex: 1, color: txn.type === 'Purchase' ? Colors.success : Colors.danger }]}>{txn.type}</Text>
                <Text style={[styles.tableRowText, { flex: 0.8, textAlign: 'right' }]}>{txn.qty}</Text>
                <Text style={[styles.tableRowText, { flex: 1, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{txn.cost}</Text>
              </Animated.View>
            ))}
          </View>
        </View>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(path, content, 'utf8');
console.log('Done');
