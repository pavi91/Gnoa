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

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 14  ,
    lineHeight: 1.4,
    border: '2pt solid #000',
  },
  header: {
    textAlign: "center", // Centers text
    marginBottom: 15,
    alignItems: 'center', // Centers all items (like Image) horizontally
  },
  section: { marginVertical: 5 },
  labelCell: { width: "40%", fontWeight: "bold" },
  valueCell: { width: "60%" },
  fieldRow: { flexDirection: "row", marginVertical: 2 },
  officeBox: {
    border: "1pt solid #000",
    marginTop: 20,
    padding: 10,
  },
  officeTitle: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 12,
  },
});

// Function to format Date objects to strings
const formatDate = (date) => {
  if (!date) return "N/A"; // Handle null/undefined
  if (date instanceof Date) {
    return date.toLocaleDateString(); // Format as MM/DD/YYYY or locale-specific format
  }
  return date; // Return as-is if already a string
};

// PDF document
export const MembershipFormDoc = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* This View now uses alignItems: 'center' from the style,
        so the Image and Text components will all be centered.
      */}
      <View style={styles.header}>
        <Image
          src={logo}
          style={{ width: 80, height: 80, marginBottom: 10 }}
        />
        <Text style={{ fontSize: 14, fontWeight: "bold" }}>
          Government Nursing Officers' Association
        </Text>
        <Text>Membership Application</Text>
      </View>

      <Text style={styles.section}>
        I hereby apply to be recruited as a member of the Government Nursing
        Officers' Association. I agree to act in accordance with and in loyalty
        to the constitution of the association, all rules and regulations
        adopted from time to time and I express my willingness to deduct the
        membership fee of the association from my salary monthly/annually as
        notified by the association.
      </Text>

      {/* Fields */}
      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Name in Full:</Text>
        <Text style={styles.valueCell}>{data.fullName || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>E-mail:</Text>
        <Text style={styles.valueCell}>{data.email || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Designation:</Text>
        <Text style={styles.valueCell}>{data.designation || "N/A"}</Text>
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
        <Text style={styles.labelCell}>Mobile Number (Personal):</Text>
        <Text style={styles.valueCell}>{data.mobile || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Gender:</Text>
        <Text style={styles.valueCell}>{data.gender || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Marital Status:</Text>
        <Text style={styles.valueCell}>{data.maritalStatus || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Employment / Salary Number:</Text>
        <Text style={styles.valueCell}>{data.employmentNumber || "N/A"}</Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>School of Nursing / University:</Text>
        <Text style={styles.valueCell}>{data.university || "N/A"}</Text>
      </View>

      {/* Signature */}
      <View style={styles.fieldRow}>
        <Text style={styles.labelCell}>Signature:</Text>
        {data.signature ? (
          <Image
            src={data.signature}
            style={{ width: 100, height: 40, marginTop: 5 }}
          />
        ) : (
          <Text style={styles.valueCell}>______________________</Text>
        )}
      </View>

      {/* Office Use Only */}
      <View style={styles.officeBox}>
        <Text style={styles.officeTitle}>Office Use Only</Text>

        <Text>
          It was decided to grant / deny membership to Mr./Ms.{" "}
          {data.fullName || "________________"} from the date: _____________
        </Text>

        <View style={styles.fieldRow}>
          <Text style={styles.labelCell}>Membership Number:</Text>
          <Text style={styles.valueCell}>________________</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.labelCell}>Date:</Text>
          <Text style={styles.valueCell}>________________</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.labelCell}>Signature:</Text>
          <Text style={styles.valueCell}>________________</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.labelCell}>President/Secretary:</Text>
          <Text style={styles.valueCell}>________________</Text>
        </View>
      </View>
    </Page>
  </Document>
);