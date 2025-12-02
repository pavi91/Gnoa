import React from "react";
import logo from "../assets/gnoa_logo.jpg";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
    color: "#333",
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1pt solid #800000',
    paddingBottom: 10,
  },
  logo: { width: 60, height: 60, marginBottom: 8 },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#800000",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
    textTransform: "uppercase",
  },
  // Style for the declaration text
  declaration: {
    fontSize: 10,
    marginBottom: 15,
    textAlign: "justify",
    lineHeight: 1.4,
  },
  fieldRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #eee",
    paddingVertical: 6,
    alignItems: 'center',
  },
  labelCell: { width: "35%", fontWeight: "bold", fontSize: 10, color: "#555" },
  valueCell: { width: "65%", fontSize: 11, color: "#000" },
  
  signatureRow: { 
    marginTop: 20,
    marginBottom: 10 
  },
  signatureBox: {
    width: 250,
    height: 80,
    border: "1pt solid #000", 
    marginTop: 5,
    padding: 5,
  },
  signatureImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  officeBox: {
    border: "1pt solid #333",
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  officeTitle: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 11,
    marginBottom: 10,
    textDecoration: 'underline',
  }
});

const formatDate = (date) => {
  if (!date) return "N/A";
  try { return new Date(date).toLocaleDateString("en-GB"); } catch (e) { return date; }
};

export const MembershipFormDoc = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        {logo && <Image src={logo} style={styles.logo} />}
        <Text style={styles.title}>Government Nursing Officers' Association</Text>
        <Text style={styles.subtitle}>Membership Application Form</Text>
      </View>

      {/* --- RESTORED DECLARATION STATEMENT --- */}
      <Text style={styles.declaration}>
        I hereby apply to be recruited as a member of the Government Nursing
        Officers' Association. I agree to act in accordance with and in loyalty
        to the constitution of the association, all rules and regulations
        adopted from time to time and I express my willingness to deduct the
        membership fee of the association from my salary monthly/annually as
        notified by the association.
      </Text>

      {/* Fields */}
      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Full Name:</Text>
        <Text style={styles.valueCell}>{data.fullName || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Designation:</Text>
        <Text style={styles.valueCell}>{data.designation || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>NIC Number:</Text>
        <Text style={styles.valueCell}>{data.nicNumber || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Email:</Text>
        <Text style={styles.valueCell}>{data.email || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Mobile Number:</Text>
        <Text style={styles.valueCell}>{data.mobile || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Institution / Hospital:</Text>
        <Text style={styles.valueCell}>{data.institution || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Official Address:</Text>
        <Text style={styles.valueCell}>{data.officialAddress || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Personal Address:</Text>
        <Text style={styles.valueCell}>{data.personalAddress || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Date of Birth:</Text>
        <Text style={styles.valueCell}>{formatDate(data.dob)}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>First Appointment Date:</Text>
        <Text style={styles.valueCell}>{formatDate(data.firstAppointmentDate)}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Gender / Marital Status:</Text>
        <Text style={styles.valueCell}>
          {data.gender || "N/A"} / {data.maritalStatus || "N/A"}
        </Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Employment No:</Text>
        <Text style={styles.valueCell}>{data.employmentNumber || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>School of Nursing:</Text>
        <Text style={styles.valueCell}>{data.university || "N/A"}</Text>
      </View>

      {/* --- SIGNATURE SECTION (FIXED + wrap=false) --- */}
      <View style={styles.signatureRow} wrap={false}>
        <Text style={styles.labelCell}>Applicant Signature:</Text>
        
        <View style={styles.signatureBox}>
          {data.signature ? (
             <Image 
                src={data.signature} 
                style={styles.signatureImage} 
             />
          ) : (
            <Text style={{ fontSize: 10, color: '#999', padding: 10 }}>[No Signature Data]</Text>
          )}
        </View>
        
        <Text style={{ fontSize: 9, marginTop: 4, color: '#666' }}>
            Signed electronically via GNOA Portal
        </Text>
      </View>

      {/* --- OFFICE USE SECTION (FIXED + wrap=false) --- */}
      <View style={styles.officeBox} wrap={false}>
        <Text style={styles.officeTitle}>OFFICE USE ONLY</Text>

        <Text style={{marginBottom: 10, fontSize: 10}}>
          Membership Application Status:  [  ] Approved    [  ] Denied
        </Text>

        <View style={styles.fieldRow}>
          <Text style={styles.labelCell}>Membership No:</Text>
          <Text style={styles.valueCell}>______________________</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.labelCell}>Processed By:</Text>
          <Text style={styles.valueCell}>______________________</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.labelCell}>Date:</Text>
          <Text style={styles.valueCell}>______________________</Text>
        </View>
      </View>

    </Page>
  </Document>
);