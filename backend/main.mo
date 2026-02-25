import List "mo:core/List";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Nat32 "mo:core/Nat32";
import Migration "migration";

(with migration = Migration.run)
actor {
  type WageEntry = {
    wageTypeCode : Text;
    description : Text;
    quantity : ?Float;
    rate : ?Float;
    percentageSurcharge : ?Float;
    taxFlag : Text;
    socialInsuranceFlag : Text;
    taxableBenefitFlag : Text;
    amount : Float;
  };

  type Summary = {
    abrechnungsBrutto : Float;
    steuerBrutto : Float;
    svBrutto : Float;
    kvBeitrag : Float;
    rvBeitrag : Float;
    avBeitrag : Float;
    pvBeitrag : Float;
    nettoentgelt : Float;
    auszahlungsbetrag : Float;
  };

  module WageEntry {
    public func compare(w1 : WageEntry, w2 : WageEntry) : Order.Order {
      Text.compare(w1.wageTypeCode, w2.wageTypeCode);
    };
  };

  let wageEntriesMap = Map.empty<Text, WageEntry>();

  var lohnsteuer : Float = 0.0;

  var seedDefaultWages : Bool = true;

  func calculateAmount(quantity : ?Float, rate : ?Float, percentageSurcharge : ?Float) : Float {
    switch (quantity, rate, percentageSurcharge) {
      case (null, null, _) { 0.0 };
      case (?q, ?r, null) { q * r };
      case (?q, ?r, ?surcharge) {
        q * r * (1.0 + (surcharge / 100.0));
      };
      case (_, _, _) { 0.0 };
    };
  };

  public shared ({ caller }) func addOrUpdateWageEntry(
    wageTypeCode : Text,
    description : Text,
    quantity : ?Float,
    rate : ?Float,
    percentageSurcharge : ?Float,
    taxFlag : Text,
    socialInsuranceFlag : Text,
    taxableBenefitFlag : Text,
    amount : ?Float,
  ) : async () {
    if (wageTypeCode.size() == 0) {
      Runtime.trap("Wage type code cannot be empty");
    };

    let calculatedAmount = switch (amount) {
      case (?a) { a };
      case (null) {
        calculateAmount(quantity, rate, percentageSurcharge);
      };
    };

    let entry : WageEntry = {
      wageTypeCode;
      description;
      quantity;
      rate;
      percentageSurcharge;
      taxFlag;
      socialInsuranceFlag;
      taxableBenefitFlag;
      amount = calculatedAmount;
    };

    wageEntriesMap.add(wageTypeCode, entry);
  };

  public shared ({ caller }) func setLohnsteuer(value : Float) : async () {
    lohnsteuer := value;
  };

  public query ({ caller }) func getLohnsteuer() : async Float {
    lohnsteuer;
  };

  public query ({ caller }) func getWageEntry(wageTypeCode : Text) : async WageEntry {
    switch (wageEntriesMap.get(wageTypeCode)) {
      case (?entry) { entry };
      case (null) { Runtime.trap("Wage entry not found") };
    };
  };

  public query ({ caller }) func getAllWageEntries() : async [WageEntry] {
    if (wageEntriesMap.isEmpty() and seedDefaultWages) {
      initDefaultEntries();
      seedDefaultWages := false;
    };
    wageEntriesMap.values().toArray().sort();
  };

  func initDefaultEntries() {
    let defaultEntry1 : WageEntry = {
      wageTypeCode = "0001";
      description = "Stundenlohn";
      quantity = ?156.0;
      rate = ?20.0;
      percentageSurcharge = null;
      taxFlag = "L";
      socialInsuranceFlag = "L";
      taxableBenefitFlag = "J";
      amount = 3120.0;
    };

    let defaultEntry2 : WageEntry = {
      wageTypeCode = "0129";
      description = "Nachtzuschlag 40%";
      quantity = ?96.0;
      rate = ?20.0;
      percentageSurcharge = ?40.0;
      taxFlag = "F";
      socialInsuranceFlag = "F";
      taxableBenefitFlag = "J";
      amount = 768.0;
    };

    let defaultEntry3 : WageEntry = {
      wageTypeCode = "0130";
      description = "Schmutzzulage 10%";
      quantity = ?156.0;
      rate = ?20.0;
      percentageSurcharge = ?10.0;
      taxFlag = "L";
      socialInsuranceFlag = "L";
      taxableBenefitFlag = "J";
      amount = 312.0;
    };

    let defaultEntry4 : WageEntry = {
      wageTypeCode = "0200";
      description = "Verpflegungspauschale";
      quantity = ?18.0;
      rate = ?14.0;
      percentageSurcharge = null;
      taxFlag = "F";
      socialInsuranceFlag = "F";
      taxableBenefitFlag = "N";
      amount = 252.0;
    };

    let defaultEntry5 : WageEntry = {
      wageTypeCode = "0201";
      description = "Wohn-/Tätigkeitspauschale";
      quantity = ?1.0;
      rate = ?173.89;
      percentageSurcharge = null;
      taxFlag = "F";
      socialInsuranceFlag = "F";
      taxableBenefitFlag = "N";
      amount = 173.89;
    };

    let defaultEntry6 : WageEntry = {
      wageTypeCode = "0300";
      description = "Feiertag";
      quantity = ?8.0;
      rate = ?20.0;
      percentageSurcharge = null;
      taxFlag = "L";
      socialInsuranceFlag = "L";
      taxableBenefitFlag = "J";
      amount = 160.0;
    };

    wageEntriesMap.add(defaultEntry1.wageTypeCode, defaultEntry1);
    wageEntriesMap.add(defaultEntry2.wageTypeCode, defaultEntry2);
    wageEntriesMap.add(defaultEntry3.wageTypeCode, defaultEntry3);
    wageEntriesMap.add(defaultEntry4.wageTypeCode, defaultEntry4);
    wageEntriesMap.add(defaultEntry5.wageTypeCode, defaultEntry5);
    wageEntriesMap.add(defaultEntry6.wageTypeCode, defaultEntry6);
  };

  public shared ({ caller }) func deleteWageEntry(wageTypeCode : Text) : async () {
    if (not wageEntriesMap.containsKey(wageTypeCode)) {
      Runtime.trap("Wage entry not found");
    };
    wageEntriesMap.remove(wageTypeCode);
  };

  public query ({ caller }) func getSummary() : async Summary {
    let entries = wageEntriesMap.values().toArray();

    let abrechnungsBrutto = entries.foldLeft(0.0, func(acc, entry) { acc + entry.amount });
    let steuerBrutto = entries.foldLeft(0.0, func(acc, entry) { acc + (if (entry.taxFlag == "L") { entry.amount } else { 0.0 }) });
    let svBrutto = entries.foldLeft(0.0, func(acc, entry) { acc + (if (entry.socialInsuranceFlag == "L") { entry.amount } else { 0.0 }) });

    let kvBeitrag = svBrutto * 0.0894;
    let rvBeitrag = svBrutto * 0.093;
    let avBeitrag = svBrutto * 0.013;
    let pvBeitrag = svBrutto * 0.018;

    let steuerfreieBeitraege = entries.foldLeft(0.0, func(acc, entry) { acc + (if (entry.taxFlag == "F" or entry.taxFlag == "P") { entry.amount } else { 0.0 }) });

    let nettoentgelt = steuerBrutto - lohnsteuer - kvBeitrag - rvBeitrag - avBeitrag - pvBeitrag + steuerfreieBeitraege;

    let verpflegungspauschale = entries.foldLeft(0.0, func(acc, entry) {
      acc + (if ((entry.taxFlag == "F" or entry.taxFlag == "P") and entry.taxableBenefitFlag == "J") { entry.amount } else { 0.0 });
    });

    let auszahlungsbetrag = nettoentgelt + verpflegungspauschale;

    {
      abrechnungsBrutto;
      steuerBrutto;
      svBrutto;
      kvBeitrag;
      rvBeitrag;
      avBeitrag;
      pvBeitrag;
      nettoentgelt;
      auszahlungsbetrag;
    };
  };
};
