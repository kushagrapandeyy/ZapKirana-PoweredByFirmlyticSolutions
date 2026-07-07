const fs = require('fs');
const path = 'app-vendor/src/app/operations/supplier/[id].tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert DUMMY_TRANSACTIONS at the top if not exists
if (!content.includes('DUMMY_TRANSACTIONS')) {
  const insertIndex = content.indexOf('export default function SupplierDetailScreen');
  const dummyData = `
const DUMMY_TRANSACTIONS = [
  { id: '1', date: 'Oct 24, 2023', type: 'Purchase', qty: 150, cost: 2450, sell: 3100 },
  { id: '2', date: 'Nov 02, 2023', type: 'Return', qty: 10, cost: 120, sell: 180 },
  { id: '3', date: 'Nov 15, 2023', type: 'Purchase', qty: 500, cost: 8900, sell: 11200 },
  { id: '4', date: 'Dec 01, 2023', type: 'Purchase', qty: 300, cost: 4500, sell: 6200 },
  { id: '5', date: 'Jan 10, 2024', type: 'Return', qty: 5, cost: 60, sell: 90 },
  { id: '6', date: 'Feb 14, 2024', type: 'Purchase', qty: 200, cost: 3200, sell: 4100 },
  { id: '7', date: 'Mar 05, 2024', type: 'Purchase', qty: 150, cost: 2450, sell: 3100 },
  { id: '8', date: 'Apr 12, 2024', type: 'Return', qty: 20, cost: 240, sell: 360 },
  { id: '9', date: 'May 20, 2024', type: 'Purchase', qty: 400, cost: 6800, sell: 8900 },
  { id: '10', date: 'Jun 11, 2024', type: 'Purchase', qty: 250, cost: 4100, sell: 5500 },
  { id: '11', date: 'Jul 04, 2024', type: 'Purchase', qty: 100, cost: 1800, sell: 2400 },
];

`;
  content = content.slice(0, insertIndex) + dummyData + content.slice(insertIndex);
}

const targetStart = '{/* Recent PO Orders (PDF/Invoices) */}';
const targetEnd = '<View style={{ height: 100 }} />';

const targetStr = content.substring(content.indexOf(targetStart), content.indexOf(targetEnd));

const replacementStr = `{/* Transaction History (Legacy View) */}
        <View style={styles.section}>
          <View style={styles.transactionHeaderRow}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>
          
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>DATE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>TYPE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>QTY</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right', color: Colors.textPrimary }]}>COST</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right' }]}>SELLING</Text>
            </View>
            <View style={styles.tableHeaderLine} />

            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
              {DUMMY_TRANSACTIONS.slice(0, 10).map((txn, index) => (
                <Animated.View key={txn.id} entering={FadeIn.delay(index * 20)} style={[styles.tableRow, index === Math.min(DUMMY_TRANSACTIONS.length, 10) - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={[styles.tableRowText, { flex: 1.5 }]}>{txn.date}</Text>
                  <Text style={[styles.tableRowText, { flex: 1, color: txn.type === 'Purchase' ? Colors.success : Colors.danger }]}>{txn.type}</Text>
                  <Text style={[styles.tableRowText, { flex: 1, textAlign: 'right' }]}>{txn.qty}</Text>
                  <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{txn.cost}</Text>
                  <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right' }]}>₹{txn.sell}</Text>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Recent PO Orders (PDF/Invoices) */}
        <View style={styles.section}>
          <View style={styles.transactionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent PO Orders</Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>DATE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>STATUS</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right', color: Colors.textPrimary }]}>AMOUNT</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>INVOICE</Text>
            </View>
            <View style={styles.tableHeaderLine} />

            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
              {purchaseOrders.length === 0 ? (
                <Text style={styles.emptyText}>No recent purchase orders.</Text>
              ) : (
                purchaseOrders.slice(0, 10).map((po: any, index: number) => (
                  <Animated.View key={po.id} entering={FadeIn.delay(index * 20)} style={[styles.tableRow, index === Math.min(purchaseOrders.length, 10) - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.tableRowText, { flex: 1.5 }]}>{new Date(po.createdAt).toLocaleDateString()}</Text>
                    <Text style={[styles.tableRowText, { flex: 1, color: po.status === 'RECEIVED' ? Colors.success : Colors.warningDark }]}>{po.status}</Text>
                    <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{po.totalAmount}</Text>
                    <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }} onPress={() => handleOpenPDF(po.id)}>
                      <Ionicons name="document-text" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  </Animated.View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Active Catalog (Supplier Products) */}
        <View style={styles.section}>
          <View style={styles.transactionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Catalog</Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>PRODUCT</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>SUPPLIER PRICE</Text>
            </View>
            <View style={styles.tableHeaderLine} />

            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
              {supplierProducts.length === 0 ? (
                <Text style={styles.emptyText}>No products linked to this supplier.</Text>
              ) : (
                supplierProducts.slice(0, 10).map((sp: any, index: number) => (
                  <Animated.View key={sp.id} entering={FadeIn.delay(index * 20)} style={[styles.tableRow, index === Math.min(supplierProducts.length, 10) - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.tableRowText, { flex: 2 }]} numberOfLines={1}>{sp.product?.name || 'Unknown'}</Text>
                    <Text style={[styles.tableRowText, { flex: 1, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{sp.price}</Text>
                  </Animated.View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        `;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(path, content, 'utf8');
console.log('Tables updated with ScrollView and max limit.');
