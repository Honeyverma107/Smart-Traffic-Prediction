
from django.urls import path

from .views import (
    RouteView,
    SendOTPView,
    VerifyOTPView,
    GoogleLoginView,
    PredictCongestionView,
    TestEmailView,
    SignalTimingView,
    CurrentTrafficView,
    HistoricalTrafficView,
    RecentTrafficView,
    VijayNagarTrafficView,
    RightTimeToGoView,
    TomTomSearchLocationView,
    TomTomReverseGeocodeView,
    AutoChallanListProcessView,
    AutoChallanDetailView,
)
from .traffic_police_views import (
    TrafficPoliceAlertsView,
    TrafficPoliceUpdateAlertStatusView,
    TrafficPoliceUnitsView
)



urlpatterns = [

    path(
        "violations/",
        AutoChallanListProcessView.as_view(),
        name="violations_list"
    ),

    path(
        "violations",
        AutoChallanListProcessView.as_view()
    ),

    path(
        "violations/process/",
        AutoChallanListProcessView.as_view(),
        name="violations_process"
    ),

    path(
        "violations/process",
        AutoChallanListProcessView.as_view()
    ),

    path(
        "violations/<str:challan_id>/",
        AutoChallanDetailView.as_view(),
        name="violation_detail"
    ),

    path(
        "location/search/",
        TomTomSearchLocationView.as_view(),
        name="location_search"
    ),

    path(
        "location/reverse/",
        TomTomReverseGeocodeView.as_view(),
        name="location_reverse"
    ),

    path(
        "routes/",
        RouteView.as_view(),
        name="routes"
    ),

    path(
        "routes",
        RouteView.as_view()
    ),

    path(
        "route/",
        RouteView.as_view(),
        name="route"
    ),

    path(
        "route",
        RouteView.as_view()
    ),

    path(
        "send-otp/",
        SendOTPView.as_view(),
        name="send_otp"
    ),

    path(
        "send-otp",
        SendOTPView.as_view()
    ),

    path(
        "verify-otp/",
        VerifyOTPView.as_view(),
        name="verify_otp"
    ),

    path(
        "verify-otp",
        VerifyOTPView.as_view()
    ),

    path(
        "google-login/",
        GoogleLoginView.as_view(),
        name="google_login"
    ),

    path(
        "google-login",
        GoogleLoginView.as_view()
    ),

    path(
        "predict-congestion/",
        PredictCongestionView.as_view(),
        name="predict_congestion"
    ),

    path(
        "predict-congestion",
        PredictCongestionView.as_view()
    ),

    path(
        "signal-timing/",
        SignalTimingView.as_view(),
        name="signal_timing"
    ),

    path(
        "signal-timing",
        SignalTimingView.as_view()
    ),

    path(
        "traffic/current/",
        CurrentTrafficView.as_view(),
        name="traffic_current"
    ),

    path(
        "traffic/current",
        CurrentTrafficView.as_view()
    ),

    path(
        "test-email/",
        TestEmailView.as_view(),
        name="test_email"
    ),

    path(
        "test-email",
        TestEmailView.as_view()
    ),

    path(
        "traffic/historical/",
        HistoricalTrafficView.as_view(),
        name="traffic_historical"
    ),

    path(
        "traffic/historical",
        HistoricalTrafficView.as_view()
    ),

    path(
        "traffic/recent/",
        RecentTrafficView.as_view(),
        name="traffic_recent"
    ),

    path(
        "traffic/recent",
        RecentTrafficView.as_view()
    ),

    path(
        "traffic/vijaynagar/",
        VijayNagarTrafficView.as_view(),
        name="traffic_vijaynagar"
    ),

    path(
        "traffic/vijaynagar",
        VijayNagarTrafficView.as_view()
    ),

    path(
        "right-time-to-go/",
        RightTimeToGoView.as_view(),
        name="right_time_to_go"
    ),

    path(
        "right-time-to-go",
        RightTimeToGoView.as_view()
    ),

    # Traffic Police Endpoints
    path(
        "traffic-police/alerts/",
        TrafficPoliceAlertsView.as_view(),
        name="traffic_police_alerts"
    ),
    path(
        "traffic-police/alerts/<str:alert_id>/status/",
        TrafficPoliceUpdateAlertStatusView.as_view(),
        name="traffic_police_update_alert_status"
    ),
    path(
        "traffic-police/units/",
        TrafficPoliceUnitsView.as_view(),
        name="traffic_police_units"
    ),
]