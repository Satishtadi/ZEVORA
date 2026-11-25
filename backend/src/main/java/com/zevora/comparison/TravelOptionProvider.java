package com.zevora.comparison;

import java.util.List;

public interface TravelOptionProvider {
    List<ComparisonDtos.TravelOption> options(ComparisonDtos.Context context);
}
