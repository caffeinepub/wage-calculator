import Map "mo:core/Map";
import Text "mo:core/Text";

module {
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

  type OldActor = {
    wageEntriesMap : Map.Map<Text, WageEntry>;
    lohnsteuer : Float;
  };
  type NewActor = {
    wageEntriesMap : Map.Map<Text, WageEntry>;
    lohnsteuer : Float;
    seedDefaultWages : Bool;
  };

  public func run(old : OldActor) : NewActor {
    { old with seedDefaultWages = true };
  };
};
